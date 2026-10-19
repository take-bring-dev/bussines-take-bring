import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatStatus } from "@/lib/format";

export default async function CarrierFleetPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c/fleet");

  const company = await prisma.carrierCompanyProfile.findUnique({
    where: { adminUserId: user.id },
    include: {
      vehicles: { orderBy: { createdAt: "desc" } },
      drivers: { orderBy: { createdAt: "desc" } },
    },
  });

  const individual = !company
    ? await prisma.carrierIndividualProfile.findUnique({
        where: { userId: user.id },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Fleet & Drivers</h1>
        <p className="text-sm text-muted-foreground">
          {company
            ? `${company.companyName} · vehicles & drivers`
            : "Your vehicle profile"}
        </p>
      </div>
      {company ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {company.vehicles.length} vehicles · {company.drivers.length} drivers
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled title="Coming soon">
                Invite driver
              </Button>
              <Button size="sm" disabled title="Coming soon">
                Add vehicle
              </Button>
            </div>
          </div>

          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vehicles
          </h2>
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {!company.vehicles.length ? (
              <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground sm:col-span-2">
                No vehicles yet. Add your first truck after KYC approval.
              </div>
            ) : null}
            {company.vehicles.map((v) => (
              <article
                key={v.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{v.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.plateNumber} · {formatStatus(v.vehicleClass)} ·{" "}
                      {v.payloadKg} kg
                    </p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              </article>
            ))}
          </div>

          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Drivers
          </h2>
          <div className="space-y-3">
            {!company.drivers.length ? (
              <div className="rounded-lg border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
                No drivers invited yet.
              </div>
            ) : null}
            {company.drivers.map((d) => (
              <article
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">{d.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.phone || "No phone"} · {d.licenceClass || "Licence TBD"}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </article>
            ))}
          </div>
        </>
      ) : individual ? (
        <article className="rounded-lg border border-border bg-card p-4">
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
            Individual carrier — upgrade to a company account to manage fleet &
            drivers.
          </p>
        </article>
      ) : (
        <div className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          No fleet profile found for this account.
        </div>
      )}
    </div>
  );
}
