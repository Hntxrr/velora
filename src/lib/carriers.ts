/**
 * Carrier detection + tracking-URL builder.
 *
 * v1 detects the carrier from the tracking-number format and links straight to
 * the carrier's tracking page. This is intentionally dependency-free; a paid
 * aggregator (EasyPost / AfterShip) can later populate real status events
 * behind the same Shipment model without changing this interface.
 */

export type CarrierId =
  | "usps"
  | "ups"
  | "fedex"
  | "dhl"
  | "amazon"
  | "ontrac"
  | "unknown";

export const CARRIERS: Record<CarrierId, { name: string; color: string }> = {
  usps: { name: "USPS", color: "#333366" },
  ups: { name: "UPS", color: "#8b6914" },
  fedex: { name: "FedEx", color: "#4d148c" },
  dhl: { name: "DHL", color: "#d40511" },
  amazon: { name: "Amazon", color: "#ff9900" },
  ontrac: { name: "OnTrac", color: "#00953b" },
  unknown: { name: "Carrier", color: "#6c6c82" },
};

const clean = (tn: string) => tn.replace(/\s+/g, "").toUpperCase();

/** Best-effort carrier detection from a tracking number. */
export function detectCarrier(trackingNumber: string): CarrierId {
  const tn = clean(trackingNumber);
  if (!tn) return "unknown";

  // UPS: 1Z + 16 alphanumerics
  if (/^1Z[0-9A-Z]{16}$/.test(tn)) return "ups";
  // Amazon Logistics
  if (/^TBA\d{10,}$/.test(tn)) return "amazon";
  // USPS: many prefixes / 20-22 digits / SXXXXXXXXXXUS format
  if (
    /^(94|93|92|94|95|91|82)\d{18,24}$/.test(tn) ||
    /^[A-Z]{2}\d{9}US$/.test(tn) ||
    /^(420\d{5})?\d{20,22}$/.test(tn)
  )
    return "usps";
  // FedEx: 12, 15, 20, or 22 digits
  if (/^\d{12}$/.test(tn) || /^\d{15}$/.test(tn) || /^\d{20}$/.test(tn) || /^\d{22}$/.test(tn))
    return "fedex";
  // DHL: 10-11 digits or JD/JJD prefixes
  if (/^\d{10,11}$/.test(tn) || /^JJD\d+$/.test(tn) || /^JD\d+$/.test(tn)) return "dhl";
  // OnTrac: C/D + 14 digits
  if (/^[CD]\d{14}$/.test(tn)) return "ontrac";

  return "unknown";
}

/** Build a click-through URL to the carrier's tracking page. */
export function trackingUrl(trackingNumber: string, carrier?: CarrierId | null): string {
  const tn = encodeURIComponent(clean(trackingNumber));
  const c = carrier && carrier !== "unknown" ? carrier : detectCarrier(trackingNumber);
  switch (c) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${tn}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${tn}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${tn}`;
    case "amazon":
      return `https://track.amazon.com/tracking/${tn}`;
    case "ontrac":
      return `https://www.ontrac.com/tracking/?number=${tn}`;
    default:
      // Universal fallback (multi-carrier lookup)
      return `https://t.17track.net/en#nums=${tn}`;
  }
}

export function carrierName(carrier?: string | null): string {
  const id = (carrier as CarrierId) in CARRIERS ? (carrier as CarrierId) : "unknown";
  return CARRIERS[id].name;
}
