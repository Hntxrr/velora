import type { EmailMessage, ParsedItem, ParsedOrder } from "./types";
import { detectCarrier } from "@/lib/carriers";

/**
 * Config-driven email parsing.
 *
 * Each retailer declares its sender domains and any label/pattern overrides.
 * A shared heuristic extractor pulls order number, totals, dates, items and
 * tracking numbers from the email text. Unknown senders fall through to the
 * generic extractor. These heuristics are intentionally conservative and are
 * meant to be refined against real sample emails per retailer — anything the
 * parser is unsure about lands in the Review Queue for one-click confirmation.
 */

type RetailerParserConfig = {
  slug: string;
  senderDomains: string[];
  orderNumberPatterns?: RegExp[];
};

const RETAILERS: RetailerParserConfig[] = [
  {
    slug: "pokemon-center",
    senderDomains: ["pokemoncenter.com", "email.pokemoncenter.com"],
    orderNumberPatterns: [/order\s*(?:number|#)\s*[:#]?\s*([A-Z0-9]{6,})/i],
  },
  {
    slug: "walmart",
    senderDomains: ["walmart.com", "email.walmart.com"],
    orderNumberPatterns: [/order\s*#?\s*([0-9]{10,})/i],
  },
  {
    slug: "target",
    senderDomains: ["target.com", "oe.target.com", "em.target.com"],
    orderNumberPatterns: [/order\s*#?\s*([0-9]{10,})/i],
  },
  {
    slug: "amazon",
    senderDomains: ["amazon.com", "marketplace.amazon.com"],
    orderNumberPatterns: [/order\s*#?\s*(1[0-9]{2}-[0-9]{7}-[0-9]{7})/i],
  },
  {
    slug: "costco",
    senderDomains: ["costco.com", "online.costco.com"],
    orderNumberPatterns: [/order\s*(?:number|#)\s*[:#]?\s*([0-9]{9,})/i],
  },
  {
    slug: "sams-club",
    senderDomains: ["samsclub.com", "email.samsclub.com"],
    orderNumberPatterns: [/order\s*#?\s*([0-9]{8,})/i],
  },
  {
    slug: "best-buy",
    senderDomains: ["bestbuy.com", "emailinfo.bestbuy.com"],
    orderNumberPatterns: [/order\s*(?:number|#)\s*[:#]?\s*(BBY[0-9-]+|[0-9]{10,})/i],
  },
];

const DEFAULT_ORDER_PATTERNS = [
  /order\s*(?:confirmation|number|no\.?|#)\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{4,})/i,
  /your\s+order\s+([A-Z0-9][A-Z0-9-]{4,})/i,
];

/** Extract the domain from a "Name <user@domain>" style from-header. */
function senderDomain(from: string): string {
  const match = from.match(/@([a-z0-9.-]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function detectRetailer(from: string): RetailerParserConfig | null {
  const domain = senderDomain(from);
  if (!domain) return null;
  return (
    RETAILERS.find((r) =>
      r.senderDomains.some((d) => domain === d || domain.endsWith("." + d) || domain.includes(d))
    ) ?? null
  );
}

function money(s: string): number {
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function findAmount(text: string, labels: string[]): number {
  for (const label of labels) {
    const re = new RegExp(`${label}[^$0-9]{0,20}\\$\\s?([0-9,]+\\.[0-9]{2})`, "i");
    const m = text.match(re);
    if (m) return money(m[1]);
  }
  return 0;
}

function findOrderNumber(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function findTracking(text: string): string[] {
  const found = new Set<string>();
  const candidates = text.match(/\b([A-Z0-9]{10,35})\b/g) ?? [];
  for (const c of candidates) {
    if (detectCarrier(c) !== "unknown") found.add(c.toUpperCase());
  }
  return Array.from(found).slice(0, 5);
}

function classify(subject: string): ParsedOrder["kind"] {
  const s = subject.toLowerCase();
  if (/(shipped|on its way|out for delivery|tracking)/.test(s)) return "shipping";
  if (/(cancel|canceled|cancelled)/.test(s)) return "cancellation";
  if (/(order|confirmation|receipt|thank you for your (order|purchase))/.test(s)) return "order";
  return "unknown";
}

/**
 * Heuristic line-item extraction. Looks for "<qty> x <name> ... $<price>" and
 * "<name> ... Qty: <n> ... $<price>" shapes. Conservative by design.
 */
function findItems(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // "2 x Product Name  $49.99" or "2× Product Name $49.99"
    let m = line.match(/^(\d{1,3})\s*[x×]\s*(.+?)\s+\$?\s?([0-9,]+\.[0-9]{2})/i);
    if (m) {
      items.push({ quantity: Number(m[1]), name: m[2].trim(), unitPrice: money(m[3]) });
      continue;
    }
    // "Product Name  Qty 2  $49.99"
    m = line.match(/^(.+?)\s+qty\.?\s*:?\s*(\d{1,3})\s+\$?\s?([0-9,]+\.[0-9]{2})/i);
    if (m) {
      items.push({ name: m[1].trim(), quantity: Number(m[2]), unitPrice: money(m[3]) });
      continue;
    }
  }
  return items.slice(0, 40);
}

function findShippingAddress(text: string): string | null {
  const m = text.match(
    /(?:ship(?:ping)?\s*(?:to|address)|deliver(?:y)?\s*to)\s*:?\s*(.{10,160}?)(?:\n\n|order|subtotal|total|tracking|$)/is
  );
  if (m?.[1]) return m[1].replace(/\s{2,}/g, " ").trim();
  return null;
}

function findAccountEmail(text: string): string | null {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : null;
}

function findPurchaseDate(text: string, fallback: Date): string {
  const m = text.match(
    /(?:order\s*date|placed\s*on|ordered\s*on)[:\s]+([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i
  );
  if (m) {
    const d = new Date(m[1]);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return fallback.toISOString();
}

export function detectRetailerSlug(from: string): string | null {
  return detectRetailer(from)?.slug ?? null;
}

/** Parse an email into a structured (pre-review) order. */
export function parseEmail(msg: EmailMessage): ParsedOrder {
  const retailer = detectRetailer(msg.from);
  const text = (msg.text || stripHtml(msg.html)).replace(/\u00a0/g, " ");
  const patterns = [...(retailer?.orderNumberPatterns ?? []), ...DEFAULT_ORDER_PATTERNS];

  const orderNumber = findOrderNumber(text, patterns);
  const grandTotal = findAmount(text, ["order total", "grand total", "total charged", "total"]);
  const taxTotal = findAmount(text, ["tax", "sales tax", "estimated tax"]);
  const shippingTotal = findAmount(text, ["shipping", "shipping & handling", "delivery"]);
  const discountTotal = findAmount(text, ["discount", "savings", "promo"]);
  const items = findItems(text);
  const trackingNumbers = findTracking(text);
  const kind = classify(msg.subject);
  const purchaseDate = findPurchaseDate(text, msg.date);
  const shippingAddress = findShippingAddress(text);
  const accountEmail = findAccountEmail(text);

  // Confidence: reward the signals that make a draft trustworthy.
  let confidence = 0;
  if (retailer) confidence += 0.25;
  if (orderNumber) confidence += 0.3;
  if (grandTotal > 0) confidence += 0.2;
  if (items.length > 0) confidence += 0.25;
  confidence = Math.min(1, confidence);

  return {
    retailerSlug: retailer?.slug ?? null,
    orderNumber,
    purchaseDate,
    items,
    taxTotal,
    shippingTotal,
    discountTotal,
    grandTotal,
    shippingAddress,
    accountEmail,
    trackingNumbers,
    confidence,
    kind,
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
