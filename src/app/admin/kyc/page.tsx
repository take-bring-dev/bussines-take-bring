import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KycActions } from "@/components/admin/kyc-actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/format";

export default async function AdminKycPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const queue = await prisma.profile.findMany({
    where: { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW", "REJECTED"] } },
    orderBy: { updatedAt: "asc" },
    include: {
      user: {
        select: { id: true, email: true, name: true, role: true, phone: true },
      },
    },
    take: 100,
  });

  const pending = queue.filter((q) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(q.kycStatus),
  );

  return (
    <AppShell
      role="admin"
      title="KYC Review Queue"
      subtitle={`${pending.length} awaiting decision · Freight Direct compliance`}
    >
      <div className="mb-3 flex gap-1.5 overflow-x-auto custom-scroll pb-1">
        {["Submitted / Under review", "Rejected", "All"].map((chip, i) => (
          <span
            key={chip}
            className={
              i === 0
                ? "shrink-0 rounded-full border border-border bg-primary-container px-3 py-1.5 text-xs font-semibold"
                : "shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
            }
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {!queue.length ? (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            KYC queue is clear.
          </div>
        ) : null}
        {queue.map((item) => {
          const name = item.user.name || item.user.email;
          return (
            <article
              key={item.id}
              className="rounded-lg border border-border bg-card p-4 shadow-[0_1px_2px_rgba(21,30,16,0.04)]"
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
    </AppShell>
  );
}
