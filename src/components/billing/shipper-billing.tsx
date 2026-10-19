"use client";

import Link from "next/link";
import { Suspense } from "react";
import { CreditCard, ExternalLink, Wallet } from "lucide-react";
import { FundEscrowButton } from "@/components/loads/fund-escrow-button";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ShipperBillingRow = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  mock: boolean;
  authorizedAt: string | null;
  capturedAt: string | null;
  load: {
    id: string;
    reference: string | null;
    status: string;
    pickupCity: string;
    deliveryCity: string;
  };
};

function statusTone(status: string) {
  if (status === "CAPTURED") return "bg-success-container/50 text-success";
  if (status === "AUTHORIZED")
    return "bg-primary-container/50 text-on-primary-container";
  if (status === "FAILED" || status === "CANCELLED")
    return "bg-error-container text-destructive";
  return "bg-surface-high text-muted-foreground";
}

export function ShipperBilling({ rows }: { rows: ShipperBillingRow[] }) {
  const due = rows.filter((r) => r.status === "AWAITING_PAYMENT");
  const held = rows.filter((r) => r.status === "AUTHORIZED");
  const paid = rows.filter((r) => r.status === "CAPTURED");
  const dueTotal = due.reduce((s, r) => s + r.amount, 0);
  const heldTotal = held.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing & Escrow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay awarded load amounts into escrow. Funds capture when the carrier
          marks delivery complete.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            To pay
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatMoney(dueTotal)}
          </p>
          <p className="text-xs text-muted-foreground">{due.length} open</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Held in escrow
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatMoney(heldTotal)}
          </p>
          <p className="text-xs text-muted-foreground">{held.length} holds</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Settled
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">{paid.length}</p>
          <p className="text-xs text-muted-foreground">Captured on delivery</p>
        </div>
      </div>

      {!rows.length ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <Wallet className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No escrow items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Award a carrier offer to create a payment due.
          </p>
          <Link
            href="/s/loads"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary-container"
          >
            Go to Active Contracts
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const ref =
              row.load.reference ||
              `TB-${row.load.id.slice(0, 8).toUpperCase()}`;
            const amountLabel = formatMoney(row.amount, row.currency);
            const needsPay =
              row.status === "AWAITING_PAYMENT" || row.status === "FAILED";

            return (
              <article
                key={row.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold">{ref}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          statusTone(row.status),
                        )}
                      >
                        {formatStatus(row.status)}
                      </span>
                      <span className="rounded bg-surface-low px-2 py-0.5 text-[11px] text-muted-foreground">
                        Load: {formatStatus(row.load.status)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {row.load.pickupCity} → {row.load.deliveryCity}
                    </p>
                    <p className="font-mono text-xl font-bold">{amountLabel}</p>
                    <Link
                      href={`/s/loads/${row.load.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View load
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  <div className="w-full shrink-0 sm:w-56 lg:w-64">
                    {needsPay ? (
                      <Suspense fallback={null}>
                        <FundEscrowButton
                          loadId={row.load.id}
                          amountLabel={amountLabel}
                          status={row.status}
                          mock={row.mock}
                          returnPath="/s/billing"
                        />
                      </Suspense>
                    ) : row.status === "AUTHORIZED" ? (
                      <div className="rounded-lg bg-primary-container/30 px-3 py-2.5 text-center text-xs font-bold text-on-primary-container">
                        <CreditCard className="mx-auto mb-1 size-4" />
                        Paid · hold active until delivery
                      </div>
                    ) : (
                      <div className="rounded-lg bg-success-container/50 px-3 py-2.5 text-center text-xs font-bold text-success">
                        Settled · captured
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
