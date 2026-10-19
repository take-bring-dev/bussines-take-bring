"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AcceptOfferButton({
  loadId,
  applicationId,
  carrierName,
  priceLabel,
  disabled,
  className,
  label = "Award & Accept Bid",
  variant = "stitch",
}: {
  loadId: string;
  applicationId: string;
  carrierName?: string;
  priceLabel?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  variant?: "default" | "stitch" | "outline";
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Accept failed");
        return;
      }
      setOpen(false);
      push("Offer awarded — fund escrow next", "success");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "default") {
    return (
      <>
        <Button size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          Award
        </Button>
        <ConfirmSheet
          open={open}
          onClose={() => setOpen(false)}
          carrierName={carrierName}
          priceLabel={priceLabel}
          error={error}
          loading={loading}
          onConfirm={() => void accept()}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
          variant === "outline"
            ? "border border-border bg-card text-foreground hover:bg-surface-low"
            : "bg-primary-container text-on-primary-container hover:bg-brand-light",
          className,
        )}
      >
        {variant !== "outline" ? <Check className="size-4" strokeWidth={2.5} /> : null}
        <span>{loading ? "Awarding…" : label}</span>
      </button>
      <ConfirmSheet
        open={open}
        onClose={() => setOpen(false)}
        carrierName={carrierName}
        priceLabel={priceLabel}
        error={error}
        loading={loading}
        onConfirm={() => void accept()}
      />
    </>
  );
}

function ConfirmSheet({
  open,
  onClose,
  carrierName,
  priceLabel,
  error,
  loading,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  carrierName?: string;
  priceLabel?: string;
  error: string | null;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Award this carrier?">
      <p className="text-sm text-muted-foreground">
        Award{" "}
        <span className="font-semibold text-foreground">
          {carrierName || "this carrier"}
        </span>
        {priceLabel ? (
          <>
            {" "}
            at <span className="font-semibold text-foreground">{priceLabel}</span>
          </>
        ) : null}
        . All other pending offers will be rejected (marketplace award model).
      </p>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-5 flex gap-2">
        <Button className="flex-1" disabled={loading} onClick={onConfirm}>
          {loading ? "Awarding…" : "Confirm award"}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Sheet>
  );
}
