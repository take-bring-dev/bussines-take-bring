"use client";

import Link from "next/link";
import { Banknote, ExternalLink, Wallet } from "lucide-react";
import { RequestPaymentButton } from "@/components/loads/request-payment-button";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

export type CarrierEarningRow = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  authorizedAt: string | null;
  capturedAt: string | null;
  load: {
    id: string;
    reference: string | null;
    status: string;
    pickupCity: string;
    deliveryCity: string;
    shipperName: string | null;
  };
};

function statusTone(status: string) {
  if (status === "CAPTURED") return "bg-success-container/50 text-success";
  if (status === "AUTHORIZED")
    return "bg-primary-container/50 text-on-primary-container";
  return "bg-surface-high text-muted-foreground";
}

function payoutLabel(status: string, loadStatus: string) {
  if (status === "CAPTURED") return "Ready / released to you";
  if (status === "AUTHORIZED") {
    if (loadStatus === "IN_TRANSIT") return "Held · deliver to receive";
    if (loadStatus === "DELIVERED") return "Releasing…";
    return "Held · awaiting your delivery";
  }
  return "Waiting for shipper to fund";
}

export function CarrierEarnings({ rows }: { rows: CarrierEarningRow[] }) {
  const incoming = rows.filter((r) => r.status === "AUTHORIZED");
  const received = rows.filter((r) => r.status === "CAPTURED");
  const pendingFund = rows.filter((r) => r.status === "AWAITING_PAYMENT");
  const incomingTotal = incoming.reduce((s, r) => s + r.amount, 0);
  const receivedTotal = received.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Earnings & Escrow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Amounts held for your awarded loads. You receive when delivery is
          marked complete.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            To receive
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatMoney(incomingTotal)}
          </p>
          <p className="text-xs text-muted-foreground">
            {incoming.length} in escrow hold
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Received
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatMoney(receivedTotal)}
          </p>
          <p className="text-xs text-muted-foreground">
            {received.length} captured
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Awaiting shipper pay
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {pendingFund.length}
          </p>
          <p className="text-xs text-muted-foreground">Not funded yet</p>
        </div>
      </div>

      {!rows.length ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center shadow-sm">
          <Wallet className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">No earnings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            When a shipper awards your bid, the amount appears here.
          </p>
          <Link
            href="/c/loads"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary-container"
          >
            My Bids & Wins
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const ref =
              row.load.reference ||
              `TB-${row.load.id.slice(0, 8).toUpperCase()}`;
            const amountLabel = formatMoney(row.amount, row.currency);

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
                    {row.load.shipperName ? (
                      <p className="text-xs text-muted-foreground">
                        Shipper: {row.load.shipperName}
                      </p>
                    ) : null}
                    <p className="font-mono text-xl font-bold">{amountLabel}</p>
                    <Link
                      href={`/c/loads/${row.load.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View bid details
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-56 lg:w-64">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-center text-xs font-bold",
                        row.status === "CAPTURED"
                          ? "bg-success-container/50 text-success"
                          : row.status === "AUTHORIZED"
                            ? "bg-primary-container/40 text-on-primary-container"
                            : "bg-surface-low text-muted-foreground",
                      )}
                    >
                      <Banknote className="mx-auto mb-1 size-4" />
                      {payoutLabel(row.status, row.load.status)}
                    </div>
                    {row.load.status === "IN_TRANSIT" ? (
                      <RequestPaymentButton
                        loadId={row.load.id}
                        loadStatus={row.load.status}
                      />
                    ) : null}
                    {row.status === "AUTHORIZED" &&
                    row.load.status !== "DELIVERED" &&
                    row.load.status !== "IN_TRANSIT" ? (
                      <Link
                        href={`/c/loads/${row.load.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card text-xs font-bold hover:bg-surface-low"
                      >
                        Mark transit / delivery
                      </Link>
                    ) : null}
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
