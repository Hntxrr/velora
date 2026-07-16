import { listOrders } from "@/lib/orders";

function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  let orders;
  try {
    orders = await listOrders();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const headers = [
    "Order Number",
    "Retailer",
    "Status",
    "Purchase Date",
    "Items",
    "Units",
    "Subtotal",
    "Tax",
    "Shipping",
    "Discount",
    "Grand Total",
    "Tags",
  ];

  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.retailerName ?? "",
      o.status,
      o.purchaseDate.slice(0, 10),
      o.itemCount,
      o.unitCount,
      o.subtotal.toFixed(2),
      o.taxTotal.toFixed(2),
      o.shippingTotal.toFixed(2),
      o.discountTotal.toFixed(2),
      o.grandTotal.toFixed(2),
      o.tags.join("; "),
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="velora-orders-${date}.csv"`,
    },
  });
}
