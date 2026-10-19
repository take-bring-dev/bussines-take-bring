import { ShipperRegisterForm } from "@/components/auth/shipper-register-form";

export const metadata = {
  title: "Shipper registration",
  description:
    "Create a shipper company account with EU VIES VAT verification — Take & Bring Business.",
};

export default function RegisterShipperPage() {
  return <ShipperRegisterForm />;
}
