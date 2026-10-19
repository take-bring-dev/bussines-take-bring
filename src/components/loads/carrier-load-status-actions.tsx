"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Action = "IN_TRANSIT" | "DELIVERED";

export function CarrierLoadStatusActions({
  loadId,
  loadStatus,
  bidAccepted,
  className,
}: {
  loadId: string;
  loadStatus: string;
  bidAccepted: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, setPending] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bidAccepted) return null;

  const canStart =
    loadStatus === "ASSIGNED" || loadStatus === "OFFER_SELECTED";
  const canDeliver = loadStatus === "IN_TRANSIT";
  const done = loadStatus === "DELIVERED";

  if (!canStart && !canDeliver && !done) return null;

  async function confirm() {
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pending }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setPending(null);
      push(
        pending === "IN_TRANSIT"
          ? "Load marked in transit"
          : "Load marked delivered",
        "success",
      );
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {canStart ? (
        <button
          type="button"
          onClick={() => setPending("IN_TRANSIT")}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 text-xs font-bold text-on-primary-container shadow-sm transition-colors hover:bg-brand-light"
        >
          <Truck className="size-4" />
          Mark picked up / In transit
        </button>
      ) : null}

      {canDeliver ? (
        <button
          type="button"
          onClick={() => setPending("DELIVERED")}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-success px-3 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <PackageCheck className="size-4" />
          Mark delivered / Complete
        </button>
      ) : null}

      {done ? (
        <div className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-success-container/50 px-3 py-2.5 text-xs font-bold text-success">
          <CheckCircle2 className="size-4" />
          Transfer complete
        </div>
      ) : null}

      {loadStatus === "IN_TRANSIT" ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Cargo is on the road — confirm delivery when POD is done.
        </p>
      ) : null}

      <Sheet
        open={pending != null}
        onClose={() => {
          if (!loading) {
            setPending(null);
            setError(null);
          }
        }}
        title={
          pending === "IN_TRANSIT"
            ? "Start transit?"
            : "Complete this transfer?"
        }
      >
        <p className="text-sm text-muted-foreground">
          {pending === "IN_TRANSIT"
            ? "Confirm you have picked up the cargo. The shipper will be notified that the load is in transit."
            : "Confirm delivery is finished. The shipper will be notified that the transfer is complete."}
        </p>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" disabled={loading} onClick={() => void confirm()}>
            {loading
              ? "Updating…"
              : pending === "IN_TRANSIT"
                ? "Confirm pickup"
                : "Confirm delivery"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={() => {
              setPending(null);
              setError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
