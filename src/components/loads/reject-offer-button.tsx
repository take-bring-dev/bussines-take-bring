"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function RejectOfferButton({
  loadId,
  applicationId,
  disabled,
  className,
}: {
  loadId: string;
  applicationId: string;
  disabled?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function reject() {
    if (!window.confirm("Reject this carrier offer?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Reject failed", "error");
        return;
      }
      push("Offer rejected", "info");
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
      disabled={disabled || loading}
      onClick={() => void reject()}
      className={cn(
        "w-1/2 rounded border border-border bg-card py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-error-container hover:text-destructive disabled:opacity-50",
        className,
      )}
    >
      {loading ? "…" : "Reject"}
    </button>
  );
}
