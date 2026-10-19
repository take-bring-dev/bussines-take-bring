import { redirect } from "next/navigation";
import { ActivationKyc } from "@/components/auth/activation-kyc";
import { getSessionUser, roleHome } from "@/lib/auth/session";

export const metadata = {
  title: "KYC verification in progress",
  description:
    "Your Take & Bring Business account was created — KYC compliance review is underway.",
};

export default async function ActivationPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/activation");

  const refCode = `ACT-${user.id.slice(-5).toUpperCase()}-EU`;

  return (
    <ActivationKyc
      dashboardHref={roleHome(user.role)}
      refCode={refCode}
    />
  );
}
