/** Normalized email message handed to parsers. */
export type EmailMessage = {
  messageId: string;
  from: string;
  subject: string;
  date: Date;
  text: string;
  html: string;
};

export type ParsedItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

/** Structured order extracted from an email (pre-review). */
export type ParsedOrder = {
  retailerSlug: string | null;
  orderNumber: string | null;
  purchaseDate: string | null; // ISO
  items: ParsedItem[];
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  trackingNumbers: string[];
  /** 0..1 heuristic confidence used to sort the review queue. */
  confidence: number;
  /** What kind of email this looked like. */
  kind: "order" | "shipping" | "cancellation" | "unknown";
};
