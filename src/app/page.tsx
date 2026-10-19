import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BusinessLanding } from "@/components/landing/business-landing";
import { brand } from "@/config/brand";
import { getSessionUser, roleHome } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: `${brand.name} Business | EU Freight Marketplace`,
  description:
    "Direct European freight marketplace — shippers post loads, verified carriers bid, award one offer. CMR, VIES & KYC compliant.",
  robots: { index: true, follow: true },
};

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.role));

  return <BusinessLanding />;
}
