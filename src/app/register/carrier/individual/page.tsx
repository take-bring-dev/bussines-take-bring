import { CarrierIndividualRegisterForm } from "@/components/auth/carrier-individual-register-form";

export const metadata = {
  title: "Solo operator registration",
  description:
    "Register as an independent EU carrier / owner-driver — Take & Bring Business.",
};

export default function RegisterCarrierIndividualPage() {
  return <CarrierIndividualRegisterForm />;
}
