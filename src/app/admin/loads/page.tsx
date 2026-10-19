import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus, formatWindow } from "@/lib/format";

export default async function AdminLoadsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "SUPER_ADMIN") redirect("/login");

  const loads = await prisma.load.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      shipper: { select: { email: true, name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <AppShell
      role="admin"
      title="Global Load Monitor"
      subtitle={`${loads.length} recent loads · marketplace health`}
    >
      <div className="space-y-3">
        {!loads.length ? (
          <div className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No loads in the system yet.
          </div>
        ) : null}
        {loads.map((l) => (
          <article
            key={l.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-outline">
                  {l.reference || `#${l.id.slice(0, 8).toUpperCase()}`}
                </p>
                <p className="font-semibold">
                  {l.pickupCity} → {l.deliveryCity}
                </p>
                <p className="text-xs text-muted-foreground">
                  Shipper: {l.shipper.name || l.shipper.email} · {l.weightKg} kg ·{" "}
                  {formatStatus(l.requiredVehicleClass)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Pickup {formatWindow(l.pickupWindowStart, l.pickupWindowEnd)}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={l.status} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {l._count.applications} offers
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
