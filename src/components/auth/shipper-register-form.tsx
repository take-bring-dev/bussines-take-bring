"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Headset,
  Lock,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/** Loose EU VAT shape: 2-letter country + 2–12 alphanumerics (spaces ignored). */
function looksLikeEuVat(raw: string) {
  const v = raw.replace(/[\s.-]/g, "").toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(v) && !/INVALID|XXX|TEST/.test(v);
}

export function ShipperRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [vatError, setVatError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [vatValue, setVatValue] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setVatError(null);

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirmPassword") || "");
    const vatId = String(fd.get("vatId") || "").trim();

    if (password !== confirm) {
      setError("Passwords do not match. Please confirm your password.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (vatId && !looksLikeEuVat(vatId)) {
      setVatError(vatId.replace(/\s/g, "").toUpperCase() || "—");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: "shipper",
          companyName: fd.get("companyName"),
          vatId: vatId || undefined,
          contactName: fd.get("contactName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Registration failed";
        if (/vat|vies/i.test(msg)) setVatError(vatId || "—");
        else setError(msg);
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

  const hasVatError = Boolean(vatError);

  return (
    <div className="flex min-h-svh flex-col bg-surface text-foreground antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 lg:px-8">
          <Link
            href="/register"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to role selection
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="flex size-7 items-center justify-center rounded bg-brand-dark text-sm font-bold text-white">
                T
              </span>
              <span className="hidden text-base font-semibold tracking-tight sm:inline">
                Take &amp; Bring Business
              </span>
            </Link>
            <span className="rounded border border-outline bg-surface-container px-1.5 py-0.5 text-[11px] text-muted-foreground">
              Shipper Onboarding
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <a
              href={brand.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden hover:text-foreground sm:inline"
            >
              take-bring.eu ↗
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {hasVatError ? (
        <section className="w-full bg-surface-low px-4 py-2 pt-20 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                <span className="size-2 animate-pulse rounded-full bg-destructive" />
                GATEWAY REJECTION: HTTP 422
              </span>
              <span className="opacity-40">/</span>
              <span>
                Node:{" "}
                <code className="font-mono text-foreground">fra-edge-04.vies.ec</code>
              </span>
            </div>
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-foreground">
              SOAP/REST SYNC
            </span>
          </div>
        </section>
      ) : null}

      <main
        className={cn(
          "flex flex-1 flex-col items-center px-4 pb-10 lg:px-8",
          hasVatError ? "pt-6" : "pt-24",
        )}
      >
        {/* Stepper */}
        <div className="mb-8 w-full max-w-[620px]">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <div className="h-1.5 w-full rounded-full bg-success" />
              <div className="flex items-center gap-1 text-success">
                <CheckCircle2 className="size-[15px]" aria-hidden />
                <span className="truncate text-[11px] font-semibold">
                  1. Role Selection
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div
                className={cn(
                  "relative h-1.5 w-full overflow-hidden rounded-full",
                  hasVatError ? "bg-destructive" : "bg-[#ABC629]",
                )}
              />
              <div
                className={cn(
                  "flex items-center gap-1 text-[11px] font-semibold",
                  hasVatError ? "text-destructive" : "text-brand-dark",
                )}
              >
                <span className="truncate">
                  2. Company &amp; VIES
                  {!hasVatError ? (
                    <span className="ml-1 inline-block rounded-full bg-[#D5E97D] px-1.5 text-[10px] font-bold uppercase text-[#181E00]">
                      Active
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 opacity-50">
              <div className="h-1.5 w-full rounded-full bg-surface-high" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <Circle className="size-[15px]" aria-hidden />
                <span className="truncate text-[11px]">3. Activation &amp; KYC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="relative w-full max-w-[620px] rounded-[8px] border border-outline bg-card p-6 shadow-[0_4px_20px_rgba(21,30,16,0.06)] md:p-8">
          <div className="mb-6">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-outline bg-surface-container px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-brand-dark" />
              Shipper Account (Class A-1) · EU VIES Registration
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
              Shipper company details
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your registered European commercial entity and contact information
              to establish your dispatch profile.
            </p>
          </div>

          {hasVatError ? (
            <div
              className="mb-6 flex items-start gap-2 rounded-[8px] bg-error-container p-4 shadow-sm"
              role="alert"
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                !
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-destructive">
                    EU VIES Validation Failed
                  </span>
                  <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    E-VAT-422
                  </span>
                </div>
                <p className="text-xs leading-snug text-foreground">
                  The VAT identification number entered (
                  <code className="rounded bg-white/60 px-1 py-0.5 font-mono font-bold text-destructive">
                    {vatError}
                  </code>
                  ) could not be verified. Please verify country code and syntax, or
                  contact your tax office.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-destructive/20 pt-2 text-[11px] text-muted-foreground">
                  <a
                    className="inline-flex items-center font-medium text-success hover:underline"
                    href="https://ec.europa.eu/taxation_customs/vies/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Query VIES Portal directly ↗
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              className="mb-4 rounded-[8px] border border-destructive/30 bg-error-container p-3 text-xs font-medium text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="companyName"
                className="flex items-center justify-between text-xs font-semibold text-foreground"
              >
                <span>
                  Registered Company Name <span className="text-destructive">*</span>
                </span>
                <span className="font-normal text-outline-strong">
                  Commercial Register match
                </span>
              </label>
              <Input
                id="companyName"
                name="companyName"
                required
                placeholder="e.g., ThyssenKrupp Materials Logistics SE"
              />
            </div>

            <div
              className={cn(
                "flex flex-col gap-1",
                hasVatError && "rounded-[8px] bg-error-container/20 p-3",
              )}
            >
              <label
                htmlFor="vatId"
                className={cn(
                  "flex items-center justify-between text-xs font-semibold",
                  hasVatError ? "text-destructive" : "text-foreground",
                )}
              >
                <span>
                  EU VAT / VIES Identification Number{" "}
                  <span className="text-destructive">*</span>
                </span>
                {hasVatError ? (
                  <span className="font-mono text-[11px]">SYNTAX_CHECK_FAIL</span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    Live VIES Check
                  </span>
                )}
              </label>
              <Input
                id="vatId"
                name="vatId"
                required
                value={vatValue}
                onChange={(e) => {
                  setVatValue(e.target.value);
                  if (vatError) setVatError(null);
                }}
                placeholder="DE 811 123 456 or NL 809 456 781 B01"
                className={cn(
                  "uppercase tracking-wide",
                  hasVatError &&
                    "border-2 border-destructive bg-white font-mono text-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
                )}
                aria-invalid={hasVatError || undefined}
              />
              {hasVatError ? (
                <p className="mt-0.5 flex items-start gap-1.5 text-xs text-destructive">
                  Invalid EU VAT format or inactive tax entity. Verify at{" "}
                  <a
                    className="font-semibold underline"
                    href="https://ec.europa.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ec.europa.eu
                  </a>
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-outline-strong">
                  Automated check against European VIES for intra-community reverse-charge
                  invoicing.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="contactName"
                className="text-xs font-semibold text-foreground"
              >
                Primary Logistics Contact Person{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="contactName"
                name="contactName"
                required
                placeholder="e.g., Jan-Erik Lindberg"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="flex items-center justify-between text-xs font-semibold text-foreground"
              >
                <span>
                  Corporate Work Email <span className="text-destructive">*</span>
                </span>
                <span className="font-normal text-outline-strong">
                  Domain verification required
                </span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="dispatch@logistics-eu.com"
              />
              <p className="mt-0.5 text-xs text-outline-strong">
                Prefer your registered corporate email domain.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Phone Number with Country Code{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+49 40 8221 490"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-foreground"
                >
                  Create Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={10}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="pr-14"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[11px] font-bold text-brand-dark hover:bg-surface-low"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <span className="mt-0.5 text-[11px] text-outline-strong">
                  Min. 10 characters
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-foreground"
                >
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="mt-0.5 size-[18px] cursor-pointer rounded accent-[#556500]"
                />
                <span className="select-none text-xs leading-relaxed text-muted-foreground">
                  I agree to the Take &amp; Bring Business Terms of Carriage, B2B Platform
                  Guidelines, and the GDPR Data Processing Addendum. I authorize VIES
                  reverse-charge status checks for this legal entity.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-12 w-full text-sm font-bold"
                disabled={loading}
              >
                {loading
                  ? "Creating account…"
                  : hasVatError
                    ? "Retry Verification & Create Account"
                    : "Create shipper account"}
                {!loading ? <ArrowRight /> : null}
              </Button>
            </div>

            <p className="pt-2 text-center text-xs text-muted-foreground">
              Already registered with Take &amp; Bring Business?
              <Link
                href="/login"
                className="ml-1 inline-flex items-center font-semibold text-brand-dark hover:underline"
              >
                Sign in to Business Portal →
              </Link>
            </p>
          </form>
        </div>

        {/* Trust note */}
        <div className="mt-6 w-full max-w-[620px] rounded-[8px] border border-outline bg-surface-container p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-outline bg-surface-high text-brand-dark">
              <ShieldCheck className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-foreground">
                Accelerated Class A-1 Verification
              </h4>
              <p className="mt-1 text-xs leading-normal text-muted-foreground">
                KYC review starts immediately after signup — once verified, your
                dispatchers can post spot loads, access pre-vetted carriers, and issue
                binding digital CMR notes.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-outline/60 pt-2 text-[11px] text-outline-strong">
                <span className="flex items-center gap-1">
                  <Lock className="size-3.5 text-success" aria-hidden />
                  256-bit TLS Encryption
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Direct VIES format check
                </span>
              </div>
            </div>
          </div>
        </div>

        {hasVatError ? (
          <div className="mt-4 flex w-full max-w-[620px] flex-col items-center justify-between gap-2 rounded-[8px] bg-surface-container p-4 text-xs text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-high">
                <Headset className="size-[18px]" aria-hidden />
              </div>
              <div>
                <span className="font-semibold text-foreground">
                  Urgent Dispatch Onboarding?
                </span>
                <p className="text-[12px]">Contact our carrier onboarding desk.</p>
              </div>
            </div>
            <a
              href="tel:+49408221490"
              className="inline-flex items-center gap-1 rounded-[8px] bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground"
            >
              <Phone className="size-3.5" aria-hidden />
              +49 40 8221 490
            </a>
          </div>
        ) : null}
      </main>

      <footer className="mt-auto w-full bg-surface-low shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row lg:px-8">
          <div>© {brand.legalName} · Hamburg, Germany</div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <Lock className="size-3.5 text-success" aria-hidden />
              Encrypted TLS 1.3
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-success" />
              EU VIES Gateway Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
