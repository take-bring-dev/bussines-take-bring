import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { FleetManager } from "@/components/fleet/fleet-manager";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/format";

export default async function CarrierFleetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c/fleet");

  if (user.role === "CARRIER_DRIVER") {
    redirect("/c/loads");
  }

  const company = await prisma.carrierCompanyProfile.findUnique({
    where: { adminUserId: user.id },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
        include: {
          drivers: {
            select: { id: true, fullName: true, status: true, userId: true },
          },
        },
      },
      drivers: {
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const individual = !company
    ? await prisma.carrierIndividualProfile.findUnique({
        where: { userId: user.id },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:px-8">
      {company ? (
        <FleetManager
          companyName={company.companyName}
          initialVehicles={company.vehicles}
          initialDrivers={company.drivers.map((d) => ({
            id: d.id,
            fullName: d.fullName,
            email: d.email,
            phone: d.phone,
            licenceClass: d.licenceClass,
            status: d.status,
            trackingEnabled: d.trackingEnabled,
            vehicleId: d.vehicleId,
            vehicle: d.vehicle,
            user: d.user,
          }))}
        />
      ) : individual ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fleet & Drivers</h1>
            <p className="text-sm text-muted-foreground">Your vehicle profile</p>
          </div>
          <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{individual.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {individual.plateNumber} ·{" "}
                  {formatStatus(individual.vehicleClass)} · max{" "}
                  {individual.maxPayloadKg} kg
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {individual.addressCity}, {individual.addressCountry}
                </p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Individual carrier — upgrade to a company account to manage fleet
              & drivers.
            </p>
          </article>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No fleet profile found for this account.
        </div>
      )}
    </div>
  );
}
