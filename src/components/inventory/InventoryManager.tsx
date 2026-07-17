"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, Boxes, DollarSign } from "lucide-react";
import type { StackDTO, SaleDTO } from "@/lib/inventory";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { addInventory, recordSale, deleteSale, deleteStack, updateStack } from "@/app/inventory/actions";

type ProductOption = { id: string; name: string };
const num = (s: string) => (s === "" ? 0 : Number(s) || 0);

export function InventoryManager({
  stacks,
  sales,
  products,
}: {
  stacks: StackDTO[];
  sales: SaleDTO[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"stock" | "sales">("stock");
  const [sellStack, setSellStack] = React.useState<StackDTO | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const refresh = () => router.refresh();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface] p-1">
          {(["stock", "sales"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-[--radius-xs] px-3 py-1.5 text-[12.5px] font-medium capitalize transition-colors " +
                (tab === t ? "bg-[--color-elevated] text-fg" : "text-fg-muted hover:text-fg")
              }
            >
              {t === "stock" ? "In stock" : "Sales"}
            </button>
          ))}
        </div>
        <Button size="md" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus size={16} /> Add inventory
        </Button>
      </div>

      {tab === "stock" ? (
        stacks.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No inventory yet"
            description="Inventory appears automatically when an order is delivered. You can also add stock manually."
          />
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[--color-border] text-[11.5px] uppercase tracking-wide text-fg-faint">
                  <th className="px-5 py-2.5 font-semibold">Product</th>
                  <th className="px-5 py-2.5 text-right font-semibold">In stock</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Cost basis</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Market value</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Unrealized</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stacks.map((s) => (
                  <StackRow key={s.id} stack={s} onSell={() => setSellStack(s)} onChange={refresh} />
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : sales.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No sales recorded"
          description="Record a sale from any in-stock item to track your true profit and ROI."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[--color-border] text-[11.5px] uppercase tracking-wide text-fg-faint">
                <th className="px-5 py-2.5 font-semibold">Product</th>
                <th className="px-5 py-2.5 font-semibold">Date</th>
                <th className="px-5 py-2.5 font-semibold">Where</th>
                <th className="px-5 py-2.5 text-right font-semibold">Qty</th>
                <th className="px-5 py-2.5 text-right font-semibold">Sold @</th>
                <th className="px-5 py-2.5 text-right font-semibold">Fees+ship</th>
                <th className="px-5 py-2.5 text-right font-semibold">Profit</th>
                <th className="px-5 py-2.5 text-right font-semibold">ROI</th>
                <th className="px-5 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-surface-2]">
                  <td className="px-5 py-3 font-medium text-fg">{s.productName}</td>
                  <td className="px-5 py-3 text-fg-muted">{s.saleDate.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-fg-muted">{s.marketplace ?? "—"}</td>
                  <td className="tabular px-5 py-3 text-right text-fg-muted">{s.quantity}</td>
                  <td className="tabular px-5 py-3 text-right text-fg-muted">{formatCurrency(s.salePriceEach)}</td>
                  <td className="tabular px-5 py-3 text-right text-fg-muted">
                    {formatCurrency(s.fees + s.outboundShipping)}
                  </td>
                  <td
                    className="tabular px-5 py-3 text-right font-semibold"
                    style={{ color: s.profit >= 0 ? "#5ad98a" : "#f58080" }}
                  >
                    {formatCurrency(s.profit)}
                  </td>
                  <td className="tabular px-5 py-3 text-right text-fg-muted">{formatPercent(s.roi)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Delete this sale? Units return to stock.")) {
                          deleteSale(s.id).finally(refresh);
                        }
                      }}
                      className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]"
                      aria-label="Delete sale"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SellModal stack={sellStack} onClose={() => setSellStack(null)} onDone={refresh} />
      <AddInventoryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        products={products}
        onDone={refresh}
      />
    </div>
  );
}

function StackRow({
  stack,
  onSell,
  onChange,
}: {
  stack: StackDTO;
  onSell: () => void;
  onChange: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(stack.currentValue?.toString() ?? "");

  const save = () => {
    updateStack(stack.id, { currentValue: value === "" ? null : num(value) }).finally(() => {
      setEditing(false);
      onChange();
    });
  };

  return (
    <tr className="border-b border-[--color-border-soft] last:border-0 hover:bg-[--color-surface-2]">
      <td className="px-5 py-3 font-medium text-fg">{stack.productName}</td>
      <td className="tabular px-5 py-3 text-right text-fg-muted">{stack.quantityAvailable}</td>
      <td className="tabular px-5 py-3 text-right text-fg-muted">{formatCurrency(stack.avgCostBasis)}</td>
      <td className="px-5 py-3 text-right">
        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="tabular w-24 rounded-[--radius-xs] border border-[--color-border] bg-[--color-surface-2] px-2 py-1 text-right text-[13px] text-fg focus:outline-none"
            placeholder="0.00"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="tabular text-fg-muted hover:text-[--color-brand-soft]">
            {stack.currentValue != null ? formatCurrency(stack.currentValue) : "Set value"}
          </button>
        )}
      </td>
      <td
        className="tabular px-5 py-3 text-right"
        style={{ color: stack.unrealized >= 0 ? "#5ad98a" : "#f58080" }}
      >
        {stack.currentValue != null ? formatCurrency(stack.unrealized) : "—"}
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={onSell} className="gap-1">
            <Tag size={13} /> Sell
          </Button>
          <button
            onClick={() => {
              if (confirm("Remove this inventory stack?")) deleteStack(stack.id).finally(onChange);
            }}
            className="rounded-[--radius-xs] p-1.5 text-fg-faint hover:bg-[--color-hover] hover:text-[--color-danger]"
            aria-label="Delete stack"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SellModal({
  stack,
  onClose,
  onDone,
}: {
  stack: StackDTO | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [qty, setQty] = React.useState("1");
  const [price, setPrice] = React.useState("");
  const [marketplace, setMarketplace] = React.useState("");
  const [fees, setFees] = React.useState("");
  const [shipping, setShipping] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (stack) {
      setQty("1");
      setPrice("");
      setMarketplace("");
      setFees("");
      setShipping("");
      setError(null);
    }
  }, [stack]);

  if (!stack) return null;

  const q = Math.max(1, Math.floor(num(qty)));
  const profit = num(price) * q - num(fees) - num(shipping) - stack.avgCostBasis * q;

  const submit = () => {
    setError(null);
    if (q > stack.quantityAvailable) return setError("Not enough units in stock.");
    if (num(price) <= 0) return setError("Enter a sale price.");
    startTransition(async () => {
      try {
        await recordSale({
          stackId: stack.id,
          quantity: q,
          salePriceEach: num(price),
          marketplace,
          fees: num(fees),
          outboundShipping: num(shipping),
        });
        onClose();
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record sale");
      }
    });
  };

  return (
    <Modal open={!!stack} onClose={onClose} title={`Sell — ${stack.productName}`}>
      <div className="space-y-3">
        <p className="text-[12.5px] text-fg-faint">
          {stack.quantityAvailable} in stock · cost basis {formatCurrency(stack.avgCostBasis)}/unit
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Quantity</Label>
            <Input type="number" min="1" max={stack.quantityAvailable} value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>
          <div>
            <Label>Sale price (each)</Label>
            <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Marketplace</Label>
            <Input value={marketplace} onChange={(e) => setMarketplace(e.target.value)} placeholder="eBay, StockX…" />
          </div>
          <div>
            <Label>Fees</Label>
            <Input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="0.00" />
          </div>
          <div className="col-span-2">
            <Label>Outbound shipping you paid</Label>
            <Input type="number" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[--radius-sm] border border-[--color-border] bg-[--color-surface-2] px-3 py-2.5">
          <span className="text-[13px] text-fg-muted">Estimated profit</span>
          <span
            className="tabular font-display text-[18px] font-semibold"
            style={{ color: profit >= 0 ? "#5ad98a" : "#f58080" }}
          >
            {formatCurrency(profit)}
          </span>
        </div>

        {error && <p className="text-[12.5px] text-[--color-danger]">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button onClick={submit} disabled={pending} className="flex-1">
            {pending ? "Recording…" : "Record sale"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddInventoryModal({
  open,
  onClose,
  products,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  products: ProductOption[];
  onDone: () => void;
}) {
  const [productId, setProductId] = React.useState("");
  const [qty, setQty] = React.useState("1");
  const [cost, setCost] = React.useState("");
  const [value, setValue] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!productId) return setError("Pick a product.");
    startTransition(async () => {
      try {
        await addInventory({
          productId,
          quantity: num(qty),
          costBasis: num(cost),
          currentValue: value === "" ? null : num(value),
        });
        onClose();
        setProductId("");
        setQty("1");
        setCost("");
        setValue("");
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to add");
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add inventory">
      {products.length === 0 ? (
        <p className="text-[13px] text-fg-muted">
          Create a product first (in the Products tab), then add inventory for it.
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>Product</Label>
            <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div>
              <Label>Cost / unit</Label>
              <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>Market value</Label>
              <Input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="opt." />
            </div>
          </div>
          {error && <p className="text-[12.5px] text-[--color-danger]">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={pending} className="flex-1">
              {pending ? "Adding…" : "Add to inventory"}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
