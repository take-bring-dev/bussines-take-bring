"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

function looksLikeEuVat(raw: string) {
  const v = raw.replace(/[\s.-]/g, "").toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(v) && !/INVALID|XXX|TEST/.test(v);
}

/** Reject obvious placeholders; accept country-code-prefixed license ids. */
function looksLikeEuLicense(raw: string) {
  const v = raw.trim().toUpperCase();
  if (!v || /INVALID|TEMP|XXX|TEST|00$/.test(v.replace(/[-\s]/g, ""))) return false;
  return /^[A-Z]{2}[-A-Z0-9]{4,24}$/.test(v.replace(/\s/g, ""));
}

const FLEET_OPTIONS = [
  { value: "2-5", label: "2–5 Commercial Vehicles (Sprinters & Megas)" },
  { value: "6-20", label: "6–20 Heavy Goods Vehicles (FTL/LTL)" },
  { value: "21-50", label: "21–50 Fleet Vehicles" },
  { value: "50+", label: "50+ Enterprise Fleet" },
] as const;

export function CarrierCompanyRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [licenseError, setLicenseError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [euLicense, setEuLicense] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLicenseError(false);

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirmPassword") || "");
    const vatId = String(fd.get("vatId") || "").trim();
    const license = String(fd.get("euLicense") || "").trim();

    if (password !== confirm) {
      setError("Passwords do not match. Please confirm your password.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (vatId && !looksLikeEuVat(vatId)) {
      setError("Invalid EU VAT / VIES format. Please verify country code and number.");
      return;
    }
    if (!looksLikeEuLicense(license)) {
      setLicenseError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: "carrier_company",
          companyName: fd.get("companyName"),
          vatId: vatId || undefined,
          euLicense: license,
          cmrPolicy: fd.get("cmrPolicy"),
          fleetSize: fd.get("fleetSize"),
          contactName: fd.get("contactName"),
          name: fd.get("contactName"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Registration failed";
        if (/license/i.test(msg)) setLicenseError(true);
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

  return (
    <div className="flex min-h-svh flex-col bg-surface text-foreground antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/85 shadow-[0_1px_8px_rgba(21,30,16,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/register"
            className="rounded-[8px] px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
          >
            ← Back to role selection
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-brand-dark">T&amp;B</span>
              <span className="hidden text-xl font-medium tracking-tight sm:inline">
                Take &amp; Bring
              </span>
              <span className="ml-1 hidden text-[11px] uppercase tracking-wider text-muted-foreground md:inline">
                Business
              </span>
            </Link>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              Carrier Fleet Onboarding
            </span>
          </div>
          <nav className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <a
              href={brand.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              take-bring.eu ↗
            </a>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {licenseError ? (
        <div className="w-full border-b border-destructive/20 bg-error-container px-4 py-2 pt-[4.5rem] text-[11px] text-[#93000A] lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-1 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold tracking-wide text-destructive">
                <span className="size-2 animate-pulse rounded-full bg-destructive" />
                GATEWAY REJECTION: HTTP 422
              </span>
              <span className="hidden opacity-40 sm:inline">/</span>
              <span className="font-mono opacity-80">Node: fra-edge-02.vies.ec</span>
            </div>
            <span className="font-medium tracking-tight text-destructive">
              EU Haulage Register Verification · SOAP/REST SYNC
            </span>
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          "flex flex-1 flex-col items-center px-4 pb-10 lg:px-8",
          licenseError ? "pt-6" : "pt-24",
        )}
      >
        {/* Stepper */}
        <nav
          aria-label="Onboarding Progress"
          className="mb-8 w-full max-w-[620px]"
        >
          <div className="relative flex items-center justify-between">
            <div className="absolute left-6 right-6 top-4 -z-0 h-0.5 bg-outline">
              <div className="h-full w-1/2 bg-brand-dark transition-all" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-brand-dark text-white shadow-sm">
                <Check className="size-4" aria-hidden />
              </div>
              <div className="mt-1.5 text-center">
                <span className="block text-[11px] font-medium text-muted-foreground">
                  Step 1
                </span>
                <span className="text-sm font-semibold text-foreground">Role Selection</span>
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold shadow-sm",
                    licenseError
                      ? "bg-destructive text-white ring-4 ring-error-container"
                      : "bg-primary-container text-on-primary-container",
                  )}
                >
                  {licenseError ? "!" : "2"}
                </div>
                {!licenseError ? (
                  <span className="absolute -top-3 rounded-full bg-brand-dark px-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Active
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 text-center">
                <span
                  className={cn(
                    "block text-[11px] font-semibold",
                    licenseError ? "text-destructive" : "text-brand-dark",
                  )}
                >
                  Step 2
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    licenseError ? "text-destructive" : "text-brand-dark",
                  )}
                >
                  Fleet &amp; License
                </span>
              </div>
            </div>
            <div className="relative z-10 flex flex-col items-center opacity-75">
              <div className="flex size-8 items-center justify-center rounded-full bg-surface-low text-xs font-semibold text-outline-strong">
                3
              </div>
              <div className="mt-1.5 text-center">
                <span className="block text-[11px] text-muted-foreground">Step 3</span>
                <span className="text-sm text-muted-foreground">Verification</span>
              </div>
            </div>
          </div>
        </nav>

        <section className="w-full max-w-[620px] rounded-[8px] border border-outline bg-card p-6 shadow-md sm:p-10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded bg-surface-container px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-dark">
              <span className="size-2 shrink-0 rounded-full bg-[#ABC629]" />
              Carrier Fleet Account (Class C-Fleet) · EU Transport License &amp; VIES
            </div>
            {licenseError ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-error-container px-2 py-0.5 text-[11px] font-medium text-destructive">
                <span className="size-1.5 rounded-full bg-destructive" />
                Action Required
              </span>
            ) : null}
          </div>

          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-[32px] md:leading-10">
            Carrier fleet company details
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Enter your European licensed road transport company credentials, commercial
            fleet size, and dispatch contact to activate spot freight bidding.
          </p>

          {licenseError ? (
            <div
              className="mb-6 flex flex-col gap-1.5 rounded-[8px] border border-destructive/30 bg-error-container p-4"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                  !
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-destructive">
                      EU Community Transport License Validation Failed [ERR-LIC-404]
                    </span>
                    <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      License_Required
                    </span>
                  </div>
                  <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
                    The EU Community Transport License Number entered is invalid or could
                    not be verified. A valid Community Haulage License is required under
                    Regulation (EC) No 1072/2009.
                  </p>
                  <a
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:underline"
                    href="https://transport.ec.europa.eu"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    EU Transport Licensing Guide ↗
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

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="companyName"
                  className="text-xs font-semibold text-foreground"
                >
                  Registered Carrier Company Name{" "}
                  <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Matches Haulage / Commercial Register
                </span>
              </div>
              <Input
                id="companyName"
                name="companyName"
                required
                placeholder="e.g., Vos Logistics Continental BV"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1">
                  <label
                    htmlFor="vatId"
                    className="text-xs font-semibold text-foreground"
                  >
                    EU VAT / VIES No. <span className="text-destructive">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                    Live VIES Check
                  </span>
                </div>
                <Input
                  id="vatId"
                  name="vatId"
                  required
                  placeholder="NL 809 456 781 B01"
                  className="font-mono text-[13px] uppercase tracking-wider"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="fleetSize"
                  className="text-xs font-semibold text-foreground"
                >
                  Fleet Size <span className="text-destructive">*</span>
                </label>
                <select
                  id="fleetSize"
                  name="fleetSize"
                  required
                  defaultValue="6-20"
                  className="flex h-10 w-full appearance-none rounded-[8px] border border-[#C6C8B0] bg-white px-3 text-xs text-[#151E10] focus-visible:border-2 focus-visible:border-[#556500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(171,198,41,0.5)]"
                >
                  {FLEET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "flex flex-col gap-1",
                  licenseError &&
                    "rounded-[8px] border border-destructive/40 bg-error-container/20 p-2 sm:col-span-2",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <label
                    htmlFor="euLicense"
                    className={cn(
                      "text-xs font-semibold",
                      licenseError ? "text-destructive" : "text-foreground",
                    )}
                  >
                    EU Community License <span className="text-destructive">*</span>
                  </label>
                  {licenseError ? (
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[11px] font-bold text-destructive">
                      COMMUNITY_LICENSE_INVALID
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      VO (EG) 1072/2009
                    </span>
                  )}
                </div>
                <Input
                  id="euLicense"
                  name="euLicense"
                  required
                  value={euLicense}
                  onChange={(e) => {
                    setEuLicense(e.target.value);
                    if (licenseError) setLicenseError(false);
                  }}
                  placeholder="e.g., NL-2024-L-88492"
                  className={cn(
                    "font-mono text-[13px] uppercase",
                    licenseError &&
                      "border-2 border-destructive bg-[#FFF8F8] text-destructive focus-visible:border-destructive",
                  )}
                  aria-invalid={licenseError || undefined}
                />
                {licenseError ? (
                  <p className="mt-1 text-xs leading-tight text-destructive">
                    Invalid license format or expired document. Must match official EU
                    format (e.g. NL-XXXX-L-XXXXX).
                  </p>
                ) : null}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1",
                  licenseError && "sm:col-span-2",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <label
                    htmlFor="cmrPolicy"
                    className="text-xs font-semibold text-foreground"
                  >
                    CMR Cargo Policy Ref. <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-success">Min. €250,000</span>
                </div>
                <Input
                  id="cmrPolicy"
                  name="cmrPolicy"
                  required
                  placeholder="e.g., ALLIANZ-CMR-994102-NL"
                  className="font-mono text-[13px] uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="contactName"
                  className="text-xs font-semibold text-foreground"
                >
                  Primary Dispatch Contact <span className="text-destructive">*</span>
                </label>
                <Input
                  id="contactName"
                  name="contactName"
                  required
                  placeholder="e.g., Jeroen van den Berg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-foreground"
                  >
                    Operations Work Email <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Direct inbox</span>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="dispatch@vos-logistics.eu"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Fleet Desk Phone (with Country Code){" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+31 13 549 7111"
                className="font-mono text-[13px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-foreground"
                  >
                    Create Password <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-brand-dark hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className="tracking-widest"
                />
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
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className="tracking-widest"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded accent-[#556500]"
                />
                <span className="select-none text-xs leading-snug text-muted-foreground">
                  I confirm holding a valid{" "}
                  <strong className="font-semibold text-foreground">
                    EU Community Haulage License
                  </strong>{" "}
                  and accept the Take &amp; Bring Business Terms of Carriage, Carrier
                  Compliance Standards, and GDPR Data Processing Addendum.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-12 w-full text-sm font-bold"
                disabled={loading}
              >
                {loading ? (
                  "Creating account…"
                ) : licenseError ? (
                  <>
                    <RefreshCw className="size-4" />
                    Retry Verification &amp; Submit Application
                  </>
                ) : (
                  <>
                    Create carrier company account
                    <ArrowRight />
                  </>
                )}
              </Button>
            </div>

            <p className="pt-1 text-center text-xs text-muted-foreground">
              Already registered with Take &amp; Bring Business?
              <Link
                href="/login"
                className="ml-1 inline-flex items-center gap-0.5 font-semibold text-brand-dark hover:underline"
              >
                Sign in to Business Portal
                <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </form>
        </section>

        <section className="mt-4 w-full max-w-[620px] rounded-[8px] bg-surface-container p-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-brand-dark shadow-sm">
              <BadgeCheck className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex flex-col gap-1">
              <h2 className="text-base font-semibold text-foreground">
                Bidding unlocks after KYC approval
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Carrier documentation (Community License &amp; CMR insurance) is reviewed
                by our compliance team. Once verified, dispatchers can bid on live spot
                loads across 27 EU member states.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded bg-surface-high/40 p-2 text-[11px] font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Lock className="size-3.5 text-brand-dark" aria-hidden />
                  256-bit TLS Encryption
                </span>
                <span className="text-outline">•</span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-success" aria-hidden />
                  Direct VIES &amp; License Check
                </span>
              </div>
            </div>
          </div>
        </section>

        {licenseError ? (
          <div className="mt-4 flex w-full max-w-[620px] flex-col items-start justify-between gap-4 rounded-[8px] border border-outline bg-surface-low p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 size-6 shrink-0 text-brand-dark" aria-hidden />
              <div>
                <span className="block text-sm font-semibold text-foreground">
                  Urgent Fleet Onboarding?
                </span>
                <span className="text-xs text-muted-foreground">
                  Our licensing desk can help with provisional review.
                </span>
              </div>
            </div>
            <a
              href="tel:+49408221490"
              className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-outline bg-card px-4 py-2 text-xs font-semibold text-foreground"
            >
              <Phone className="size-4" aria-hidden />
              +49 40 8221 490
            </a>
          </div>
        ) : (
          <aside className="mb-6 mt-2 w-full max-w-[620px] text-center">
            <p className="text-[11px] text-outline-strong">
              Regulation (EC) No 1072/2009 — common rules for access to the international
              road haulage market.
            </p>
          </aside>
        )}
      </main>

      <footer className="mt-auto w-full bg-surface-low shadow-[0_-1px_6px_rgba(21,30,16,0.03)]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-4 text-[11px] text-muted-foreground sm:flex-row lg:px-8">
          <div className="flex items-center gap-1.5">
            <span>© {brand.legalName}</span>
            <span>•</span>
            <span>Hamburg, Germany</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Encrypted TLS 1.3</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-success" />
              EU VIES Gateway Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
