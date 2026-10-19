import { redirect } from "next/navigation";
import { ShipperChrome } from "@/components/layout/shipper-chrome";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function ShipperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/s");
  if (user.role !== "SHIPPER" && user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const [profile, unreadCount] = await Promise.all([
    prisma.shipperProfile.findUnique({ where: { userId: user.id } }),
    prisma.notification.count({
      where: { userId: user.id, readAt: null },
    }),
  ]);

  const companyName =
    profile?.companyName?.trim() ||
    user.name ||
    user.email.split("@")[0] ||
    "Shipper";

  return (
    <ShipperChrome
      companyName={companyName}
      vatId={profile?.vatId}
      unreadCount={unreadCount}
    >
      {children}
    </ShipperChrome>
  );
}
