"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createProduct } from "@/app/products/actions";

export function NewProductButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  if (!open) {
    return (
      <Button size="md" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={16} /> New product
      </Button>
    );
  }

  const create = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createProduct({ name });
      setName("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
        placeholder="Product name"
        className="w-56"
      />
      <Button size="md" onClick={create} disabled={pending || !name.trim()}>
        Add
      </Button>
      <Button size="md" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
