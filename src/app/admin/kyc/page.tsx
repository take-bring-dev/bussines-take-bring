import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Shield } from "lucide-react";
import { KycActions } from "@/components/admin/kyc-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/format";

export default async function AdminKycPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const { filter: rawFilter } = await searchParams;
  const filter = rawFilter === "rejected" || rawFilter === "all" ? rawFilter : "pending";

  const where: Prisma.ProfileWhereInput =
    filter === "rejected"
      ? { kycStatus: "REJECTED" }
      : filter === "all"
        ? { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW", "REJECTED"] } }
        : { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } };

  const queue = await prisma.profile.findMany({
    where,
    orderBy: { updatedAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true, phone: true },
      },
    },
    take: 100,
  });

  const pendingCount = await prisma.profile.count({
    where: { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
  });

  const chips = [
    { key: "pending", label: "Submitted / Under review", href: "/admin/kyc" },
    { key: "rejected", label: "Rejected", href: "/admin/kyc?filter=rejected" },
    { key: "all", label: "All", href: "/admin/kyc?filter=all" },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Platform Control Center • Compliance</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            KYC review queue
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Approve or reject identity documents before marketplace access is granted.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <Shield className="size-4 text-primary" />
          <span>{pendingCount} awaiting decision</span>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {chips.map((chip) => {
          const active = filter === chip.key;
          return (
            <a
              key={chip.key}
              href={chip.href}
              className={
                active
                  ? "shrink-0 rounded-full bg-primary-container px-3 py-1.5 text-xs font-semibold text-on-primary-container shadow-sm"
                  : "shrink-0 rounded-full bg-surface-container px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-high"
              }
            >
              {chip.label}
            </a>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {!queue.length ? (
          <div className="rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
            KYC queue is clear for this filter.
          </div>
        ) : null}
        {queue.map((item) => {
          const name = item.user.name || item.user.email;
          return (
            <article
              key={item.id}
              className="rounded-lg bg-card p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{name}</p>
                    <StatusBadge status={item.kycStatus} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.user.email} · {formatStatus(item.user.role)}
                    {item.user.phone ? ` · ${item.user.phone}` : ""}
                  </p>
                  {item.kycNote ? (
                    <p className="mt-2 text-xs text-destructive">Note: {item.kycNote}</p>
                  ) : null}
                </div>
                {["SUBMITTED", "UNDER_REVIEW"].includes(item.kycStatus) ? (
                  <KycActions userId={item.user.id} name={name} />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
