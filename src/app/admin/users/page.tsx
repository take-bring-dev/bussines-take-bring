import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell
      role="admin"
      title="User Directory"
      subtitle={`${users.length} accounts · ${byRole.SHIPPER} shippers · ${byRole.CARRIER} carriers`}
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Shippers", value: byRole.SHIPPER },
          { label: "Carriers", value: byRole.CARRIER },
          { label: "Admins", value: byRole.ADMIN },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden border-b border-border bg-surface-low px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-12">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3">KYC</span>
        </div>
        <div className="divide-y divide-border">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-2 px-3 py-3 md:grid md:grid-cols-12 md:items-center"
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
    </AppShell>
  );
}
