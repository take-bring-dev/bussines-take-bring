"use client";

import { Suspense } from "react";
import { Lock } from "lucide-react";
import { FundEscrowButton } from "@/components/loads/fund-escrow-button";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export type EscrowPanelData = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  mock: boolean;
  authorizedAt: string | null;
  capturedAt: string | null;
  stripePaymentIntentId: string | null;
} | null;

function statusTone(status: string) {
  if (status === "CAPTURED") return "bg-success-container/50 text-success";
  if (status === "AUTHORIZED")
    return "bg-primary-container/50 text-on-primary-container";
  if (status === "FAILED" || status === "CANCELLED")
    return "bg-error-container text-destructive";
  return "bg-surface-high text-muted-foreground";
}

function statusLabel(status: string) {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Awaiting fund";
    case "AUTHORIZED":
      return "Hold authorized";
    case "CAPTURED":
      return "Captured on delivery";
    default:
      return formatStatus(status);
  }
}

export function EscrowPanel({
  loadId,
  escrow,
  fallbackAmount,
  fallbackCurrency = "EUR",
  reference,
}: {
  loadId: string;
  escrow: EscrowPanelData;
  fallbackAmount: number | null;
  fallbackCurrency?: string;
  reference: string;
}) {
  const amount = escrow?.amount ?? fallbackAmount;
  const currency = escrow?.currency ?? fallbackCurrency;
  const amountLabel =
    amount != null ? formatMoney(amount, currency) : "—";

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-primary" />
          <h3 className="text-xs font-bold tracking-wider uppercase">
            Escrow Protection & Settlement
          </h3>
        </div>
        <span className="rounded bg-success-container/40 px-2 py-0.5 text-[10px] font-bold text-primary">
          Stripe test / mock
        </span>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-surface-low p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Escrow reference</span>
          <span className="font-mono font-bold">
            {escrow
              ? `ESC-${escrow.id.slice(0, 10).toUpperCase()}`
              : `ESC-${reference.slice(0, 10)}`}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Reserved funds</span>
          <span className="font-mono font-bold">{amountLabel}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Escrow status</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-bold",
              statusTone(escrow?.status ?? "AWAITING_PAYMENT"),
            )}
          >
            {escrow ? statusLabel(escrow.status) : "Award carrier to open"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Settlement trigger</span>
          <span className="font-medium text-success">Capture on DELIVERED</span>
        </div>
        {escrow?.authorizedAt ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Authorized</span>
            <span className="font-mono text-[11px]">
              {new Date(escrow.authorizedAt).toLocaleString("de-DE")}
            </span>
          </div>
        ) : null}
        {escrow?.capturedAt ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Captured</span>
            <span className="font-mono text-[11px]">
              {new Date(escrow.capturedAt).toLocaleString("de-DE")}
            </span>
          </div>
        ) : null}
      </div>

      {escrow &&
      (escrow.status === "AWAITING_PAYMENT" || escrow.status === "FAILED") ? (
        <Suspense fallback={null}>
          <FundEscrowButton
            loadId={loadId}
            amountLabel={amountLabel}
            status={escrow.status}
            mock={escrow.mock}
          />
        </Suspense>
      ) : null}

      {escrow?.status === "AUTHORIZED" ? (
        <p className="rounded-md bg-primary-container/30 px-3 py-2 text-[11px] font-semibold text-on-primary-container">
          Hold active — amount captures when carrier marks delivered.
        </p>
      ) : null}

      {escrow?.status === "CAPTURED" ? (
        <p className="rounded-md bg-success-container/50 px-3 py-2 text-[11px] font-semibold text-success">
          Escrow captured after delivery (test). Carrier Connect payout comes
          later.
        </p>
      ) : null}

      <div className="space-y-1 text-[11px] text-muted-foreground">
        <p className="font-bold text-foreground">How it works (dev)</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>Award bid → create escrow</li>
          <li>Fund → Stripe test Checkout (manual capture) or mock hold</li>
          <li>Carrier marks delivered → capture payment</li>
        </ul>
      </div>
    </div>
  );
}
