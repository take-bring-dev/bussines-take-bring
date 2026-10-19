import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/ui/kpi-card";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "SUPER_ADMIN") redirect("/login");

  const [users, kycPending, openLoads, offersToday] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.profile.count({
      where: { kycStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.load.count({
      where: { status: { in: ["PUBLISHED", "RECEIVING_OFFERS"] } },
    }),
    prisma.loadApplication.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return (
    <AppShell
      role="admin"
      title="Admin overview"
      subtitle="Platform ops · KYC · marketplace health"
    >
      <p className="mb-4 text-xs text-muted-foreground">Live platform metrics</p>
      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4 md:gap-3">
        <KpiCard label="Users" value={users} hint="active accounts" badge="Live" />
        <KpiCard
          label="KYC pending"
          value={kycPending}
          hint="awaiting review"
          badge={kycPending > 0 ? "Action needed" : undefined}
          badgeTone={kycPending > 0 ? "danger" : "default"}
        />
        <KpiCard label="Open loads" value={openLoads} hint="on the board" />
        <KpiCard label="Offers today" value={offersToday} hint="carrier bids" />
      </section>
    </AppShell>
  );
}
