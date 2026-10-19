"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function RequestPaymentButton({
  loadId,
  loadStatus,
  className,
}: {
  loadId: string;
  loadStatus: string;
  className?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  if (loadStatus !== "IN_TRANSIT") return null;

  async function request() {
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/request-payment`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Request failed", "error");
        return;
      }
      push("Payment request sent to shipper", "success");
      router.refresh();
    } catch {
      push("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void request()}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold transition-colors hover:bg-surface-low disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Banknote className="size-4" />
      )}
      {loading ? "Sending…" : "Request payment from shipper"}
    </button>
  );
}
