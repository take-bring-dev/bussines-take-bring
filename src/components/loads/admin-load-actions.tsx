"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { AcceptOfferButton } from "@/components/loads/accept-offer-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/format";

type Bid = {
  id: string;
  status: string;
  proposedPrice: number;
  currency: string;
  carrierName: string;
};

export function AdminPublishButton({
  loadId,
  disabled,
}: {
  loadId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function publish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Publish failed", "error");
        return;
      }
      push("Load published to carrier board", "success");
      router.refresh();
    } catch {
      push("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      disabled={disabled || loading}
      onClick={() => void publish()}
      className="gap-1.5"
    >
      <Megaphone className="size-4" />
      {loading ? "Publishing…" : "Publish to board"}
    </Button>
  );
}

export function AdminAwardBids({
  loadId,
  bids,
  canAward,
}: {
  loadId: string;
  bids: Bid[];
  canAward: boolean;
}) {
  if (!canAward) return null;
  const pending = bids.filter((b) => b.status === "PENDING");
  if (!pending.length) return null;

  return (
    <ul className="mt-3 space-y-2">
      {pending.map((b) => (
        <li
          key={b.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-low px-3 py-2"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{b.carrierName}</p>
            <p className="text-xs font-bold tabular-nums">
              {formatMoney(b.proposedPrice, b.currency)}
            </p>
          </div>
          <AcceptOfferButton
            loadId={loadId}
            applicationId={b.id}
            carrierName={b.carrierName}
            priceLabel={formatMoney(b.proposedPrice, b.currency)}
            label="Accept bid"
            variant="default"
          />
        </li>
      ))}
    </ul>
  );
}
