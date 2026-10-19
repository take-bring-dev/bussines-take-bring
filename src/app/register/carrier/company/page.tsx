import { CarrierCompanyRegisterForm } from "@/components/auth/carrier-company-register-form";

export const metadata = {
  title: "Carrier company registration",
  description:
    "Register a licensed EU carrier fleet with Community License, CMR insurance, and VIES — Take & Bring Business.",
};

export default function RegisterCarrierCompanyPage() {
  return <CarrierCompanyRegisterForm />;
}
