"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, GitMerge, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { renameProduct, mergeProducts, deleteProduct } from "@/app/products/actions";

type ProductOption = { id: string; name: string };

export function ProductDetailActions({
  id,
  name,
  category,
  others,
}: {
  id: string;
  name: string;
  category: string | null;
  others: ProductOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(name);
  const [newCategory, setNewCategory] = React.useState(category ?? "");
  const [mergeId, setMergeId] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const save = () =>
    startTransition(async () => {
      await renameProduct(id, newName, newCategory);
      setEditing(false);
      router.refresh();
    });

  const merge = () => {
    if (!mergeId) return;
    if (!confirm("Merge this product into the selected one? This product will be removed."))
      return;
    startTransition(async () => {
      await mergeProducts(id, mergeId);
      router.push(`/products/${mergeId}`);
    });
  };

  const remove = () => {
    if (!confirm("Delete this product? Orders keep their items but lose the product link."))
      return;
    startTransition(async () => {
      await deleteProduct(id);
      router.push("/products");
    });
  };

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-52" />
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category"
          className="w-40"
        />
        <Button size="md" onClick={save} disabled={pending} className="gap-1.5">
          <Check size={15} /> Save
        </Button>
        <Button size="md" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="md" variant="secondary" onClick={() => setEditing(true)} className="gap-1.5">
        <Pencil size={15} /> Rename
      </Button>
      {others.length > 0 && (
        <div className="flex items-center gap-1.5">
          <Select value={mergeId} onChange={(e) => setMergeId(e.target.value)} className="w-44">
            <option value="">Merge into…</option>
            {others.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button size="md" variant="secondary" onClick={merge} disabled={pending || !mergeId} className="gap-1.5">
            <GitMerge size={15} /> Merge
          </Button>
        </div>
      )}
      <Button size="icon" variant="ghost" onClick={remove} disabled={pending} aria-label="Delete product">
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
