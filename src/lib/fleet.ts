import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getCompanyForAdmin(userId: string) {
  return prisma.carrierCompanyProfile.findUnique({
    where: { adminUserId: userId },
  });
}

export async function getDriverForUser(userId: string) {
  return prisma.driver.findUnique({
    where: { userId },
    include: { vehicle: true, company: true },
  });
}

/** Company admin of this company, or the driver themselves. */
export async function canManageCompanyFleet(
  user: { id: string; role: UserRole },
  companyId: string,
) {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "CARRIER_COMPANY_ADMIN") {
    const company = await getCompanyForAdmin(user.id);
    return company?.id === companyId;
  }
  return false;
}

export function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${out}!1`;
}
