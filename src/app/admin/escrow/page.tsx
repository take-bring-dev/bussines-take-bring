import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";

export default async function AdminEscrowPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const escrows = await prisma.escrowPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      load: {
        select: {
          id: true,
          reference: true,
          pickupCity: true,
          deliveryCity: true,
          status: true,
        },
      },
      shipper: { select: { name: true, email: true } },
    },
  });

  const carrierIds = [...new Set(escrows.map((e) => e.carrierUserId))];
  const carriers = carrierIds.length
    ? await prisma.user.findMany({
        where: { id: { in: carrierIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const carrierById = Object.fromEntries(carriers.map((c) => [c.id, c]));

  const awaiting = escrows.filter((e) => e.status === "AWAITING_PAYMENT").length;
  const authorized = escrows.filter((e) => e.status === "AUTHORIZED").length;
  const captured = escrows.filter((e) => e.status === "CAPTURED").length;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Platform Control Center • Settlements</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            Escrow monitor
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Platform-wide escrow: awaiting funding, authorized holds, and captured
            payouts — same ledger language as shipper billing / carrier earnings.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <Wallet className="size-4 text-primary" />
          <span>{escrows.length} escrow records</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Awaiting payment", value: awaiting },
          { label: "Authorized", value: authorized },
          { label: "Captured", value: captured },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col justify-between rounded-lg bg-card p-4 shadow-sm"
          >
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {s.label}
            </span>
            <span className="my-1.5 text-3xl font-semibold tabular-nums md:text-4xl">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        {!escrows.length ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No escrow payments yet.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {escrows.map((e) => {
              const carrier = carrierById[e.carrierUserId];
              return (
                <li key={e.id}>
                  <Link
                    href={`/admin/loads/${e.load.id}`}
                    className="flex flex-col gap-2 px-4 py-3.5 transition-colors hover:bg-surface-high sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          {e.load.reference ||
                            `#${e.load.id.slice(0, 8).toUpperCase()}`}
                        </p>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {e.load.pickupCity} → {e.load.deliveryCity}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Shipper {e.shipper.name || e.shipper.email} · Carrier{" "}
                        {carrier?.name || carrier?.email || "—"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold tabular-nums">
                        {formatMoney(Number(e.amount), e.currency)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.createdAt.toLocaleString("de-DE")}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
