"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { detectCarrier, CARRIERS, type CarrierId } from "@/lib/carriers";
import { addShipment } from "@/app/tracking/actions";

const CARRIER_IDS = Object.keys(CARRIERS) as CarrierId[];

export function AddTrackingForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [tn, setTn] = React.useState("");
  const [carrier, setCarrier] = React.useState<CarrierId | "auto">("auto");
  const [pending, startTransition] = React.useTransition();

  const detected = tn.trim() ? detectCarrier(tn) : null;

  const submit = () => {
    if (!tn.trim()) return;
    startTransition(async () => {
      await addShipment({
        orderId,
        trackingNumber: tn.trim(),
        carrier: carrier === "auto" ? null : carrier,
      });
      setTn("");
      setCarrier("auto");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={tn}
        onChange={(e) => setTn(e.target.value)}
        placeholder="Tracking number"
        className="flex-1 font-mono"
      />
      <Select
        value={carrier}
        onChange={(e) => setCarrier(e.target.value as CarrierId | "auto")}
        className="sm:w-40"
      >
        <option value="auto">
          {detected && detected !== "unknown"
            ? `Auto (${CARRIERS[detected].name})`
            : "Auto-detect"}
        </option>
        {CARRIER_IDS.filter((c) => c !== "unknown").map((c) => (
          <option key={c} value={c}>
            {CARRIERS[c].name}
          </option>
        ))}
      </Select>
      <Button onClick={submit} disabled={pending || !tn.trim()} className="gap-1.5">
        <Plus size={15} /> {pending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}
