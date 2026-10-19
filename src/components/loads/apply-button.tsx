"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function ApplyButton({
  loadId,
  defaultPrice,
  routeLabel,
  loadRef,
  className,
  label = "Place Bid / Counter Quote",
  variant = "stitch",
}: {
  loadId: string;
  defaultPrice?: number | null;
  routeLabel?: string;
  loadRef?: string;
  className?: string;
  label?: string;
  variant?: "default" | "stitch" | "secondary";
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(
    defaultPrice != null ? String(defaultPrice) : "",
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function apply() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPrice: Number(price),
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Apply failed");
        return;
      }
      setOpen(false);
      setMessage("");
      push("Offer submitted — shipper will award one carrier", "success");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const trigger =
    variant === "default" ? (
      <Button size="sm" onClick={() => setOpen(true)}>
        Apply
      </Button>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (defaultPrice != null && !price) setPrice(String(defaultPrice));
          setOpen(true);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-[0.99]",
          variant === "secondary"
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-primary-container text-on-primary-container hover:bg-brand-light",
          className,
        )}
      >
        <Gavel className="size-5" />
        <span>{label}</span>
      </button>
    );

  return (
    <>
      {trigger}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Submit Dispatch Quotation"
        description={
          routeLabel
            ? `${loadRef || "Load"} · ${routeLabel}`
            : "Propose a net price — shipper awards one carrier"
        }
      >
        <div className="space-y-4">
          {defaultPrice != null ? (
            <p className="rounded-lg bg-surface-low px-3 py-2 text-xs text-muted-foreground">
              Shipper target:{" "}
              <strong className="text-foreground">
                €{Number(defaultPrice).toLocaleString("de-DE", {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`price-${loadId}`}>Your all-in freight offer (€ net)</Label>
            <Input
              id={`price-${loadId}`}
              type="number"
              min={1}
              step="0.01"
              placeholder="420.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 text-base font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`msg-${loadId}`}>Message (optional)</Label>
            <Input
              id={`msg-${loadId}`}
              placeholder="Same-day pickup available"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-12"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" disabled={loading} onClick={() => void apply()}>
              {loading ? "Transmitting…" : "Transmit Binding Bid"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
