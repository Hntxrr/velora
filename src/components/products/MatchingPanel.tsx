"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Link2 } from "lucide-react";
import type { UnmatchedGroup } from "@/lib/products";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { createProductFromGroup, assignGroupToProduct } from "@/app/products/actions";

type ProductOption = { id: string; name: string };

export function MatchingPanel({
  groups,
  products,
}: {
  groups: UnmatchedGroup[];
  products: ProductOption[];
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);

  if (groups.length === 0) return null;

  return (
    <Card className="mb-6 border-[--color-brand]/30 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[--radius-sm]"
          style={{ background: "var(--gradient-brand-soft)" }}
        >
          <Sparkles size={15} className="text-[--color-brand-soft]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-fg">Needs matching</h3>
          <p className="text-[12px] text-fg-faint">
            Link these line items to a product so lifetime stats stay accurate. We&apos;ll
            remember the match for next time.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {groups.map((g) => (
          <GroupRow
            key={g.normalizedName}
            group={g}
            products={products}
            busy={pendingKey === g.normalizedName}
            onCreate={(name) => {
              setPendingKey(g.normalizedName);
              createProductFromGroup({
                name,
                normalizedName: g.normalizedName,
                sampleName: g.sampleName,
                itemIds: g.itemIds,
              }).finally(() => {
                setPendingKey(null);
                router.refresh();
              });
            }}
            onAssign={(productId) => {
              setPendingKey(g.normalizedName);
              assignGroupToProduct({
                productId,
                normalizedName: g.normalizedName,
                sampleName: g.sampleName,
                itemIds: g.itemIds,
              }).finally(() => {
                setPendingKey(null);
                router.refresh();
              });
            }}
          />
        ))}
      </div>
    </Card>
  );
}

function GroupRow({
  group,
  products,
  busy,
  onCreate,
  onAssign,
}: {
  group: UnmatchedGroup;
  products: ProductOption[];
  busy: boolean;
  onCreate: (name: string) => void;
  onAssign: (productId: string) => void;
}) {
  const [name, setName] = React.useState(group.sampleName);
  const [assignId, setAssignId] = React.useState("");

  return (
    <div className="rounded-[--radius-sm] border border-[--color-border-soft] bg-[--color-surface-2] p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-fg">{group.sampleName}</p>
          <p className="text-[11.5px] text-fg-faint">
            {group.units} units · {group.lines} line item{group.lines === 1 ? "" : "s"}
            {group.retailers.length > 0 && ` · ${group.retailers.join(", ")}`}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          placeholder="Product name"
        />
        <Button size="sm" onClick={() => onCreate(name)} disabled={busy} className="gap-1.5">
          <Plus size={14} /> New product
        </Button>
        {products.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Select
              value={assignId}
              onChange={(e) => setAssignId(e.target.value)}
              className="sm:w-44"
            >
              <option value="">Assign to…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !assignId}
              onClick={() => assignId && onAssign(assignId)}
              className="gap-1.5"
            >
              <Link2 size={14} /> Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
