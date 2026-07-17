"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { Input, Textarea, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { allocateCosts } from "@/lib/costing";
import { formatCurrency } from "@/lib/utils";
import { createOrder, updateOrder, type OrderInput } from "@/app/orders/actions";
import type { OrderDTO } from "@/lib/orders";

type Retailer = { id: string; name: string };
type LineRow = { rawName: string; quantity: string; unitPrice: string };

const STATUSES = ["CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export function OrderForm({
  retailers,
  order,
}: {
  retailers: Retailer[];
  order?: OrderDTO;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [retailerId, setRetailerId] = React.useState(order?.retailerId ?? "");
  const [storeLabel, setStoreLabel] = React.useState(order?.storeLabel ?? "");
  const [orderNumber, setOrderNumber] = React.useState(order?.orderNumber ?? "");
  const [status, setStatus] = React.useState(order?.status ?? "CONFIRMED");
  const [priority, setPriority] = React.useState(order?.priority ?? "NORMAL");
  const [purchaseDate, setPurchaseDate] = React.useState(
    order?.purchaseDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [deliveryDateEst, setDeliveryDateEst] = React.useState(
    order?.deliveryDateEst?.slice(0, 10) ?? ""
  );
  const [taxTotal, setTaxTotal] = React.useState(String(order?.taxTotal ?? ""));
  const [shippingTotal, setShippingTotal] = React.useState(String(order?.shippingTotal ?? ""));
  const [discountTotal, setDiscountTotal] = React.useState(String(order?.discountTotal ?? ""));
  const [tags, setTags] = React.useState((order?.tags ?? []).join(", "));
  const [notes, setNotes] = React.useState(order?.notes ?? "");
  const [accountEmail, setAccountEmail] = React.useState(order?.accountEmail ?? "");
  const [shippingAddress, setShippingAddress] = React.useState(order?.shippingAddress ?? "");
  const [lines, setLines] = React.useState<LineRow[]>(
    order?.items.map((i) => ({
      rawName: i.rawName,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })) ?? [{ rawName: "", quantity: "1", unitPrice: "" }]
  );

  const num = (s: string) => (s === "" ? 0 : Number(s) || 0);

  const preview = React.useMemo(
    () =>
      allocateCosts({
        items: lines.map((l) => ({ quantity: num(l.quantity), unitPrice: num(l.unitPrice) })),
        taxTotal: num(taxTotal),
        shippingTotal: num(shippingTotal),
        discountTotal: num(discountTotal),
      }),
    [lines, taxTotal, shippingTotal, discountTotal]
  );

  const updateLine = (idx: number, patch: Partial<LineRow>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const addLine = () =>
    setLines((prev) => [...prev, { rawName: "", quantity: "1", unitPrice: "" }]);
  const removeLine = (idx: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const submit = () => {
    setError(null);
    if (!orderNumber.trim()) return setError("Order number is required.");
    if (lines.every((l) => !l.rawName.trim())) return setError("Add at least one item.");

    const input: OrderInput = {
      orderNumber: orderNumber.trim(),
      retailerId: retailerId || null,
      storeLabel: storeLabel.trim() || null,
      status: status as OrderInput["status"],
      priority: priority as OrderInput["priority"],
      purchaseDate: new Date(purchaseDate).toISOString(),
      deliveryDateEst: deliveryDateEst ? new Date(deliveryDateEst).toISOString() : null,
      accountEmail: accountEmail.trim() || null,
      shippingAddress: shippingAddress.trim() || null,
      taxTotal: num(taxTotal),
      shippingTotal: num(shippingTotal),
      discountTotal: num(discountTotal),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: notes.trim() || null,
      items: lines
        .filter((l) => l.rawName.trim())
        .map((l) => ({
          rawName: l.rawName.trim(),
          quantity: Math.max(1, Math.floor(num(l.quantity))),
          unitPrice: num(l.unitPrice),
        })),
    };

    startTransition(async () => {
      try {
        if (order) await updateOrder(order.id, input);
        else await createOrder(input);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Order details */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-fg">Order details</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Retailer</Label>
              <Select value={retailerId} onChange={(e) => setRetailerId(e.target.value)}>
                <option value="">Select retailer…</option>
                {retailers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Store / label (optional)</Label>
              <Input value={storeLabel} onChange={(e) => setStoreLabel(e.target.value)} placeholder="e.g. Store #1234" />
            </div>
            <div>
              <Label>Order number</Label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="PC-88213" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Purchase date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <Label>Est. delivery (optional)</Label>
              <Input type="date" value={deliveryDateEst} onChange={(e) => setDeliveryDateEst(e.target.value)} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
            <div>
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hype, restock" />
            </div>
            <div>
              <Label>Account / buyer email</Label>
              <Input value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} placeholder="which account placed it" />
            </div>
            <div className="sm:col-span-2">
              <Label>Shipping address</Label>
              <Textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Where it's being sent"
                className="min-h-[64px]"
              />
            </div>
          </div>
        </Card>

        {/* Line items */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">Items</h3>
            <Button variant="ghost" size="sm" onClick={addLine} className="gap-1.5">
              <Plus size={15} /> Add item
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1">
                  {idx === 0 && <Label>Product name</Label>}
                  <Input
                    value={l.rawName}
                    onChange={(e) => updateLine(idx, { rawName: e.target.value })}
                    placeholder="Scarlet & Violet 151 Elite Trainer Box"
                  />
                </div>
                <div className="w-20">
                  {idx === 0 && <Label>Qty</Label>}
                  <Input
                    type="number"
                    min="1"
                    value={l.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  />
                </div>
                <div className="w-28">
                  {idx === 0 && <Label>Unit price</Label>}
                  <Input
                    type="number"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => updateLine(idx, { unitPrice: e.target.value })}
                    placeholder="49.99"
                  />
                </div>
                <button
                  onClick={() => removeLine(idx)}
                  className="mb-1 rounded-[--radius-xs] p-2 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]"
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-fg">Costs &amp; notes</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>Tax</Label>
              <Input type="number" step="0.01" value={taxTotal} onChange={(e) => setTaxTotal(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Shipping</Label>
              <Input type="number" step="0.01" value={shippingTotal} onChange={(e) => setShippingTotal(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Discount</Label>
              <Input type="number" step="0.01" value={discountTotal} onChange={(e) => setDiscountTotal(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="mt-3">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering…" />
          </div>
        </Card>
      </div>

      {/* Summary rail */}
      <div className="lg:col-span-1">
        <Card className="sticky top-20 p-5">
          <h3 className="mb-4 text-sm font-semibold text-fg">Summary</h3>
          <dl className="space-y-2 text-[13px]">
            <Row label="Subtotal" value={formatCurrency(preview.subtotal)} />
            <Row label="Tax" value={formatCurrency(num(taxTotal))} />
            <Row label="Shipping" value={formatCurrency(num(shippingTotal))} />
            <Row label="Discount" value={`− ${formatCurrency(num(discountTotal))}`} />
            <div className="my-2 border-t border-[--color-border]" />
            <div className="flex items-center justify-between">
              <dt className="font-semibold text-fg">Grand total</dt>
              <dd className="tabular font-display text-[18px] font-semibold text-fg">
                {formatCurrency(preview.grandTotal)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-[11.5px] leading-relaxed text-fg-faint">
            Tax &amp; shipping are allocated across items so each unit&apos;s true
            cost basis is accurate for profit.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-[--radius-sm] border border-[--color-danger]/40 bg-[--color-danger]/10 px-3 py-2 text-[12.5px] text-[--color-danger]">
              <X size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={submit} disabled={pending} className="flex-1">
              {pending ? "Saving…" : order ? "Save changes" : "Create order"}
            </Button>
            <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="tabular text-fg">{value}</dd>
    </div>
  );
}
