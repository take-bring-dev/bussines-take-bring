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
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const VEHICLE_OPTIONS = [
  {
    value: "sprinter",
    label: "3.5t Sprinter / High-Roof Box Van (Standard European Express)",
    hint: "Permits real-time load matching by payload and deck dimensions",
  },
  {
    value: "tractor",
    label: "Solo Tractor Unit (Without Trailer / Spot Puller)",
    hint: "Cab-only · partner trailer arrangements",
  },
  {
    value: "rigid",
    label: "7.5t Rigid Box Truck with Tail Lift",
    hint: "Tail-lift capable · regional FTL/LTL",
  },
  {
    value: "curtainsider",
    label: "3.5t Tarpaulin Curtainsider (8-10 Pallets)",
    hint: "8–10 Euro-pallets · curtainsider deck",
  },
  {
    value: "other",
    label: "Other Commercial Freight Vehicle",
    hint: "Specify details during KYC document upload",
  },
] as const;

export function CarrierIndividualRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>("sprinter");

  const vehicleHint =
    VEHICLE_OPTIONS.find((v) => v.value === vehicleType)?.hint ??
    VEHICLE_OPTIONS[0].hint;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPasswordMismatch(false);

    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirmPassword") || "");

    if (password !== confirm) {
      setPasswordMismatch(true);
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: "carrier_individual",
          name: fd.get("name"),
          tradeRegNo: fd.get("tradeRegNo"),
          vatId: String(fd.get("vatId") || "").trim() || undefined,
          vehicleType: fd.get("vehicleType"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password,
          maxPayloadKg: vehicleType === "rigid" ? 3500 : 1250,
          plateNumber: "PENDING",
        }),
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
              <span className="text-xl font-bold tracking-tight text-brand-dark">
                T&amp;B
              </span>
              <span className="hidden text-xl font-medium tracking-tight sm:inline">
                Take &amp; Bring
              </span>
              <span className="ml-1 hidden text-[11px] uppercase tracking-wider text-muted-foreground md:inline">
                Business
              </span>
            </Link>
            <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-brand-dark">
              Solo Operator Onboarding
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

      {passwordMismatch ? (
        <aside
          aria-label="System Diagnostics"
          className="w-full bg-error-container px-4 py-2 pt-[4.5rem] text-[11px] text-[#93000A] shadow-sm lg:px-8"
        >
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-destructive" />
              <span className="font-bold uppercase tracking-tight text-destructive">
                GATEWAY VALIDATION:
              </span>
              <span className="font-semibold">HTTP 422</span>
              <span className="opacity-60">•</span>
              <span className="font-mono font-semibold">Code: AUTH-PWD-MISMATCH</span>
              <span className="hidden opacity-60 sm:inline">•</span>
              <span className="hidden font-mono opacity-90 sm:inline">
                Form Session: SOLO-44102-PL
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider opacity-80">
              <span className="hidden md:inline">Dual-channel validation active</span>
              <span className="hidden opacity-40 md:inline">•</span>
              <span>Latency: 42ms</span>
              <span className="opacity-40">•</span>
              <span>Endpoint: /v2/auth/register/solo</span>
            </div>
          </div>
        </aside>
      ) : null}

      <main
        className={cn(
          "flex flex-1 flex-col items-center px-4 pb-10 lg:px-8",
          passwordMismatch ? "pt-6" : "pt-24",
        )}
      >
        {/* Stepper */}
        <nav
          aria-label="Registration Progress"
          className="mb-8 w-full max-w-[680px]"
        >
          <div className="flex items-center justify-between gap-1.5 rounded-[8px] bg-surface-container p-2 shadow-sm">
            <div className="flex shrink-0 items-center gap-1.5 rounded-[8px] bg-card px-2 py-1.5 shadow-sm">
              <span className="flex size-5 items-center justify-center rounded-full bg-success text-[12px] font-bold text-white">
                ✓
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-tight text-success">
                  Step 1
                </span>
                <span className="whitespace-nowrap text-xs font-semibold text-foreground">
                  Role Selected
                </span>
              </div>
            </div>
            <div
              className={cn(
                "mx-1 h-0.5 flex-1 rounded-full",
                passwordMismatch ? "bg-success/40" : "bg-[#ABC629]",
              )}
            />
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-1.5 shadow-sm",
                passwordMismatch
                  ? "bg-error-container"
                  : "bg-primary-container text-on-primary-container",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[11px] font-bold",
                  passwordMismatch
                    ? "bg-destructive text-white"
                    : "bg-on-primary-container text-primary-container",
                )}
              >
                {passwordMismatch ? "!" : "2"}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      passwordMismatch
                        ? "text-destructive"
                        : "text-on-primary-container/80",
                    )}
                  >
                    {passwordMismatch ? "Step 2" : "Active"}
                  </span>
                  {passwordMismatch ? (
                    <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Error
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-bold",
                    passwordMismatch ? "text-destructive" : "text-on-primary-container",
                  )}
                >
                  Solo Operator Details
                </span>
              </div>
            </div>
            <div className="mx-1 h-0.5 flex-1 rounded-full bg-surface-high" />
            <div className="flex shrink-0 items-center gap-1.5 px-2 py-1.5 text-muted-foreground opacity-75">
              <span className="flex size-5 items-center justify-center rounded-full bg-surface-high text-[11px] font-medium">
                3
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] tracking-tight">Step 3</span>
                <span className="whitespace-nowrap text-xs font-medium">
                  Activation &amp; KYC
                </span>
              </div>
            </div>
          </div>
        </nav>

        <section className="relative flex w-full max-w-[680px] flex-col overflow-hidden rounded-[8px] bg-card p-6 shadow-md sm:p-8">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#ABC629] via-brand-dark to-[#D3EF51]" />

          <div className="mb-4 flex items-center justify-between gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wider",
                passwordMismatch
                  ? "bg-error-container text-destructive"
                  : "bg-surface-container text-brand-dark",
              )}
            >
              <span
                className={cn(
                  "inline-block size-2 animate-pulse rounded-full",
                  passwordMismatch ? "bg-destructive" : "bg-brand-dark",
                )}
              />
              {passwordMismatch
                ? "Independent Operator (Class C-Solo) · Validation Failed"
                : "Independent Operator (Class C-Solo) · EU Transport Protocol"}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {passwordMismatch ? "EU-VIES Sync: OK" : "EU Standard V4.2"}
            </span>
          </div>

          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground md:text-[32px] md:leading-10">
            Solo operator details
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Enter your legal personal credentials, commercial trade register details, and
            transport vehicle specifications to unlock direct mobile load bidding across EU
            freight corridors.
          </p>

          {passwordMismatch ? (
            <div
              className="mb-6 flex items-start gap-2 rounded-[8px] bg-error-container p-4 shadow-sm"
              role="alert"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive text-sm font-bold text-white shadow-sm">
                !
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[#93000A]">
                    Password Confirmation Mismatch [AUTH-PWD-MISMATCH]
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-destructive">
                    Field: pwd_confirm
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#93000A]">
                  The password entered in{" "}
                  <strong className="font-semibold text-destructive">Confirm Password</strong>{" "}
                  does not match. Re-enter both fields with identical characters (min. 10).
                </p>
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

          <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate={passwordMismatch}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Full Legal Name <span className="text-destructive">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Matches Passport / Driver ID
                </span>
              </div>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g., Marek Kowalski"
              />
              <p className="mt-0.5 flex items-center gap-1 text-xs text-outline-strong">
                Must match official EU driving license and identity card.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="tradeRegNo"
                  className="text-sm font-semibold text-foreground"
                >
                  Commercial Reg. No. <span className="text-destructive">*</span>
                </label>
                <Input
                  id="tradeRegNo"
                  name="tradeRegNo"
                  required
                  placeholder="e.g., DE-HRB-771928"
                />
                <span className="text-[11px] text-outline-strong">
                  Sole proprietorship or trade code
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="vatId"
                    className="text-sm font-semibold text-foreground"
                  >
                    EU VAT ID
                  </label>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    Optional
                  </span>
                </div>
                <Input
                  id="vatId"
                  name="vatId"
                  placeholder="e.g., PL 123 456 78 90"
                />
                <span className="text-[11px] text-outline-strong">
                  Optional for small enterprise exemption
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="vehicleType"
                className="text-sm font-semibold text-foreground"
              >
                Primary Vehicle Type <span className="text-destructive">*</span>
              </label>
              <select
                id="vehicleType"
                name="vehicleType"
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="flex h-10 w-full appearance-none rounded-[8px] border border-[#C6C8B0] bg-white px-3 text-xs text-[#151E10] focus-visible:border-2 focus-visible:border-[#556500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(171,198,41,0.5)]"
              >
                {VEHICLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="mt-1 flex items-center gap-1.5 rounded bg-surface-low p-1.5 text-xs text-muted-foreground">
                <Truck className="size-4 text-brand-dark" aria-hidden />
                <span>{vehicleHint}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Driver / Work Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="m.kowalski@freight-express.eu"
                />
                <span className="text-[11px] text-outline-strong">
                  Instant trip manifests &amp; CMR sent here
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                  Mobile Phone Number <span className="text-destructive">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+48 601 234 567"
                />
                <span className="text-[11px] text-outline-strong">
                  For SMS gate codes &amp; loading bay checks
                </span>
              </div>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-4 sm:grid-cols-2",
                passwordMismatch &&
                  "rounded-[8px] bg-error-container/40 p-4 shadow-sm",
              )}
            >
              {passwordMismatch ? (
                <div className="col-span-full mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                    <Lock className="size-4" aria-hidden />
                    Security Credentials Required
                  </span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-bold text-destructive shadow-sm">
                    2 ISSUES DETECTED
                  </span>
                </div>
              ) : null}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-foreground"
                  >
                    Create Password <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    className="rounded px-1.5 py-1 text-[11px] font-bold text-brand-dark hover:bg-surface-container"
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
                  onChange={() => passwordMismatch && setPasswordMismatch(false)}
                />
                <span className="text-[11px] text-outline-strong">
                  Min. 10 chars with numbers &amp; symbols
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="confirmPassword"
                    className={cn(
                      "text-sm font-semibold",
                      passwordMismatch ? "text-destructive" : "text-foreground",
                    )}
                  >
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  {passwordMismatch ? (
                    <span className="inline-flex items-center gap-1 rounded bg-destructive px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      Mismatch
                    </span>
                  ) : null}
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className={cn(
                    passwordMismatch &&
                      "border-2 border-destructive text-destructive focus-visible:border-destructive",
                  )}
                  aria-invalid={passwordMismatch || undefined}
                  onChange={() => passwordMismatch && setPasswordMismatch(false)}
                />
                {passwordMismatch ? (
                  <p className="mt-0.5 text-xs font-medium text-destructive">
                    Passwords do not match. Please ensure both passwords match exactly.
                  </p>
                ) : (
                  <span className="text-[11px] text-success">
                    Enter the same password twice
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-1.5 rounded-[8px] bg-surface-low p-4">
              <label className="flex cursor-pointer select-none items-start gap-2">
                <input
                  type="checkbox"
                  name="terms"
                  required
                  className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[#556500]"
                />
                <span className="text-xs leading-snug text-foreground">
                  I confirm holding a valid commercial freight transport permit, valid EU
                  driving license (Category B/C/CE), and agree to the Take &amp; Bring
                  Terms of Carriage, Solo Operator Guidelines, and GDPR Data Processing
                  Addendum.
                </span>
              </label>
              <div className="flex items-center gap-1 pl-6 text-[11px] text-muted-foreground">
                <BadgeCheck className="size-3.5 text-success" aria-hidden />
                Requires valid driver licensing &amp; freight transport permit
              </div>
            </div>

            <Button
              type="submit"
              className="mt-1 h-12 w-full text-sm font-bold"
              disabled={loading}
            >
              {loading ? (
                "Creating account…"
              ) : passwordMismatch ? (
                <>
                  <RefreshCw className="size-4" />
                  Retry &amp; Create solo operator account
                </>
              ) : (
                <>
                  Create solo operator account
                  <ArrowRight />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already registered with Take &amp; Bring Business?
              <Link
                href="/login"
                className="ml-1 font-semibold text-brand-dark underline hover:text-on-primary-container"
              >
                Sign in to Business Portal →
              </Link>
            </p>
          </form>
        </section>

        <section className="mt-6 w-full max-w-[680px] rounded-[8px] bg-surface-container p-4 shadow-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-card text-brand-dark shadow-sm">
              <Zap className="size-6" aria-hidden />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-foreground">
                  Fast-Track Mobile KYC &amp; Instant Payouts
                </h2>
                <span className="rounded bg-success-container px-2 py-0.5 text-[11px] font-semibold text-success">
                  SLA: &lt; 120 MIN
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Solo driver documents (driving license, vehicle registration, and basic
                carrier liability) are reviewed within 2 hours. Once cleared, you can accept
                spot freight via the mobile app with 14-day guaranteed payment escrow.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
                  <Zap className="size-4 text-success" aria-hidden />
                  2h Fast-Track Mobile Clearance
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
                  <Truck className="size-4 text-brand-dark" aria-hidden />
                  1-Click Mobile App Bidding
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">
                  <ShieldCheck className="size-4 text-success" aria-hidden />
                  Direct Escrow Payouts
                </span>
              </div>
            </div>
          </div>
        </section>

        {passwordMismatch ? (
          <div className="mt-6 flex w-full max-w-[680px] flex-col items-center justify-between gap-4 rounded-[8px] bg-surface-container p-4 shadow-sm sm:flex-row">
            <div className="flex items-start gap-2">
              <Phone className="mt-0.5 size-6 shrink-0 text-brand-dark" aria-hidden />
              <div>
                <span className="block text-sm font-semibold text-foreground">
                  Need assistance with registration or vehicle compliance?
                </span>
                <span className="text-xs text-muted-foreground">
                  Solo Dispatch Desk is available Mon–Fri 06:00 – 22:00 CET
                </span>
              </div>
            </div>
            <a
              href="tel:+49408221490"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-card px-4 text-xs font-semibold text-foreground shadow-sm"
            >
              <Phone className="size-4 text-success" aria-hidden />
              +49 40 8221 490
            </a>
          </div>
        ) : (
          <div className="mt-4 flex w-full max-w-[680px] items-center justify-between gap-2 px-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="size-2 animate-pulse rounded-full bg-brand-dark" />
              <span>
                Operational: 3,420 loads dispatched in EU Central Corridors today
              </span>
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              <ShieldCheck className="size-3.5" aria-hidden />
              <span>CMR Insurance Standard ISO 27001</span>
            </div>
          </div>
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
