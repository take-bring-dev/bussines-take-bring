import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Carrier registration" };

export default function RegisterCarrierPage() {
  return (
    <AuthShell
      title="Carrier type"
      subtitle="Individual operator or company fleet — same apply-to-load flow."
    >
      <div className="space-y-3">
        <Link href="/register/carrier/individual">
          <Card className="mb-3 transition hover:border-primary">
            <CardHeader>
              <CardTitle>Individual</CardTitle>
              <CardDescription>Own vehicle, self-employed documents.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/register/carrier/company">
          <Card className="transition hover:border-primary">
            <CardHeader>
              <CardTitle>Company</CardTitle>
              <CardDescription>Fleet, trucks, and drivers under one account.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
      <Button variant="ghost" className="mt-4 w-full" asChild>
        <Link href="/register">← Back</Link>
      </Button>
    </AuthShell>
  );
}
