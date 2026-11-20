import { redirect } from "next/navigation";
import { CarrierChrome } from "@/components/layout/carrier-chrome";
import { LocationTracker } from "@/components/location/location-tracker";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const CARRIER_ROLES = [
  "CARRIER_INDIVIDUAL",
  "CARRIER_COMPANY_ADMIN",
  "CARRIER_DRIVER",
  "SUPER_ADMIN",
] as const;

export default async function CarrierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/c");
  if (!CARRIER_ROLES.includes(user.role as (typeof CARRIER_ROLES)[number])) {
    redirect("/login");
  }

  const [company, individual, driver, unreadCount, activeTrip] =
    await Promise.all([
      prisma.carrierCompanyProfile.findUnique({
        where: { adminUserId: user.id },
      }),
      prisma.carrierIndividualProfile.findUnique({
        where: { userId: user.id },
      }),
      prisma.driver.findUnique({ where: { userId: user.id } }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
      // Enable PWA GPS assist while on an active assigned/transit job
      prisma.loadApplication.findFirst({
        where: {
          status: "ACCEPTED",
          load: { status: { in: ["ASSIGNED", "IN_TRANSIT"] } },
          OR: [
            { applicantUserId: user.id },
            ...(user.role === "CARRIER_DRIVER"
              ? [{ driver: { userId: user.id } }]
              : []),
          ],
        },
        select: { id: true },
      }),
    ]);

  const companyName =
    company?.companyName?.trim() ||
    individual?.fullName?.trim() ||
    driver?.fullName?.trim() ||
    user.name ||
    user.email.split("@")[0] ||
    "Carrier";

  const trackWhileOpen =
    Boolean(activeTrip) &&
    (user.role === "CARRIER_DRIVER" || user.role === "CARRIER_INDIVIDUAL");

  return (
    <CarrierChrome
      companyName={companyName}
      vatId={company?.vatId || individual?.vatId}
      unreadCount={unreadCount}
      role={user.role}
    >
      <LocationTracker enabled={trackWhileOpen} />
      {children}
    </CarrierChrome>
  );
}
