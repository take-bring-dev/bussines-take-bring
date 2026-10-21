import { redirect } from "next/navigation";
import { AdminChrome } from "@/components/layout/admin-chrome";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "SUPER_ADMIN") redirect("/login");

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  const adminName = user.name?.trim() || user.email.split("@")[0] || "Admin";

  return (
    <AdminChrome adminName={adminName} unreadCount={unreadCount}>
      {children}
    </AdminChrome>
  );
}
