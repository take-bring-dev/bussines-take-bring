import { redirect } from "next/navigation";
import { Search, Users } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/format";

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { profile: { select: { kycStatus: true } } },
  });

  const byRole = {
    SHIPPER: users.filter((u) => u.role === "SHIPPER").length,
    CARRIER: users.filter((u) => u.role.startsWith("CARRIER")).length,
    ADMIN: users.filter((u) => u.role === "SUPER_ADMIN").length,
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 pb-6 md:flex-row md:items-end">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider text-primary uppercase">
            <span className="size-2 rounded-full bg-primary-container" />
            <span>Platform Control Center • Accounts</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
            User directory
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            All shipper, carrier, and admin accounts with KYC and status.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container px-2 py-1.5 text-[11px] font-medium text-muted-foreground shadow-sm">
          <Users className="size-4 text-primary" />
          <span>{users.length} accounts loaded</span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Shippers", value: byRole.SHIPPER, hint: "Industrial dispatch" },
          { label: "Carriers", value: byRole.CARRIER, hint: "Fleet & individual" },
          { label: "Admins", value: byRole.ADMIN, hint: "Platform operators" },
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
            <span className="text-xs text-muted-foreground">{s.hint}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface-low p-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground" />
          <input
            readOnly
            className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none"
            placeholder="Search name, email, role…"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow-sm">
        <div className="hidden border-b border-border bg-surface-low px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase md:grid md:grid-cols-12">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3">KYC</span>
        </div>
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-2 px-4 py-3.5 md:grid md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-4">
                <p className="font-semibold">{u.name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <p className="text-xs font-medium md:col-span-3">
                {formatStatus(u.role)}
              </p>
              <div className="md:col-span-2">
                <StatusBadge status={u.status} />
              </div>
              <div className="md:col-span-3">
                {u.profile ? (
                  <StatusBadge status={u.profile.kycStatus} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
