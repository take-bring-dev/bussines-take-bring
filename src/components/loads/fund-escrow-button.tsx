"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function FundEscrowButton({
  loadId,
  amountLabel,
  status,
  mock,
  className,
  returnPath,
}: {
  loadId: string;
  amountLabel: string;
  status: string | null;
  mock?: boolean;
  className?: string;
  /** Where to return after Stripe Checkout (default: load detail). */
  returnPath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const home =
    returnPath && returnPath.startsWith("/")
      ? returnPath
      : `/s/loads/${loadId}`;

  useEffect(() => {
    const flag = searchParams.get("escrow");
    const qLoad = searchParams.get("loadId");
    if (!flag) return;
    if (qLoad && qLoad !== loadId) return;

    async function afterReturn() {
      if (flag === "funded") {
        await fetch(`/api/loads/${loadId}/escrow/sync`, { method: "POST" });
        push("Escrow authorized (test)", "success");
        router.replace(home);
        router.refresh();
      } else if (flag === "cancelled") {
        push("Escrow checkout cancelled", "error");
        router.replace(home);
      }
    }

    void afterReturn();
  }, [home, loadId, push, router, searchParams]);

  if (status === "AUTHORIZED" || status === "CAPTURED") {
    return null;
  }

  async function fund() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/escrow/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: home }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start escrow");
        return;
      }
      if (data.url) {
        window.location.href = data.url as string;
        return;
      }
      if (data.mock || data.alreadyFunded) {
        push(
          data.mock
            ? "Escrow authorized (mock / no Stripe keys)"
            : "Escrow already funded",
          "success",
        );
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void fund()}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-3 py-2.5 text-xs font-bold text-on-primary-container shadow-sm transition-colors hover:bg-brand-light disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : mock ? (
          <Lock className="size-4" />
        ) : (
          <CreditCard className="size-4" />
        )}
        {loading
          ? "Starting…"
          : `Pay ${amountLabel}${mock ? " (mock)" : " (Stripe test)"}`}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-[10px] text-muted-foreground">
        Authorize hold now. Amount captures when carrier marks delivered.
      </p>
    </div>
  );
}
