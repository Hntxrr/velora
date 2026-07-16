/**
 * Cost-basis engine.
 *
 * Resellers need each unit's TRUE cost, which includes its proportional share
 * of order-level tax and shipping (minus discount). We allocate those pooled
 * amounts across line items in proportion to each line's subtotal, then divide
 * by quantity to get the effective per-unit cost.
 */

export type LineInput = {
  quantity: number;
  unitPrice: number;
};

export type AllocatedLine = {
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  allocatedTax: number;
  allocatedShipping: number;
  allocatedDiscount: number;
  /** True per-unit cost basis including allocations. */
  effectiveUnitCost: number;
  /** True total cost for the whole line. */
  lineTotalCost: number;
};

export type OrderCostInput = {
  items: LineInput[];
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Allocate pooled tax/shipping/discount across line items proportionally by
 * subtotal. Returns per-line allocations and effective per-unit cost.
 */
export function allocateCosts(input: OrderCostInput): {
  lines: AllocatedLine[];
  subtotal: number;
  grandTotal: number;
} {
  const { items, taxTotal, shippingTotal, discountTotal } = input;
  const subtotals = items.map((i) => round2(i.quantity * i.unitPrice));
  const subtotal = round2(subtotals.reduce((a, b) => a + b, 0));

  const lines: AllocatedLine[] = items.map((item, idx) => {
    const lineSubtotal = subtotals[idx];
    const share = subtotal > 0 ? lineSubtotal / subtotal : 1 / items.length;

    const allocatedTax = round2(taxTotal * share);
    const allocatedShipping = round2(shippingTotal * share);
    const allocatedDiscount = round2(discountTotal * share);

    const lineTotalCost = round2(
      lineSubtotal + allocatedTax + allocatedShipping - allocatedDiscount
    );
    const effectiveUnitCost =
      item.quantity > 0 ? round2(lineTotalCost / item.quantity) : 0;

    return {
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineSubtotal,
      allocatedTax,
      allocatedShipping,
      allocatedDiscount,
      effectiveUnitCost,
      lineTotalCost,
    };
  });

  const grandTotal = round2(
    subtotal + taxTotal + shippingTotal - discountTotal
  );

  return { lines, subtotal, grandTotal };
}
