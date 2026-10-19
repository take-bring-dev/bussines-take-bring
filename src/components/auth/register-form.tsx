"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  span?: boolean;
};

type Props = {
  accountType: "shipper" | "carrier_individual" | "carrier_company";
  fields: Field[];
};

export function RegisterForm({ accountType, fields }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { accountType };
    for (const [k, v] of fd.entries()) payload[k] = String(v);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push(data.redirectTo || "/activation");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div
            key={f.name}
            className={f.span ? "space-y-2 sm:col-span-2" : "space-y-2"}
          >
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              name={f.name}
              type={f.type || "text"}
              required={f.required !== false}
              placeholder={f.placeholder}
              minLength={f.type === "password" ? 10 : undefined}
              autoComplete={
                f.type === "password"
                  ? "new-password"
                  : f.type === "email"
                    ? "email"
                    : undefined
              }
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        By continuing you agree to Terms & Privacy. Account starts in KYC review.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <Button variant="ghost" className="w-full" asChild>
        <Link href="/register">← Back</Link>
      </Button>
    </form>
  );
}
