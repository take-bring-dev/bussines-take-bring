import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Headset,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { brand } from "@/config/brand";

export function ActivationKyc({
  dashboardHref,
  refCode = "ACT-99402-EU",
}: {
  dashboardHref: string;
  refCode?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-surface text-foreground antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/90 shadow-[0_1px_8px_rgba(21,30,16,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tracking-tight text-brand-dark">
                T&amp;B
              </span>
              <span className="text-xl font-semibold tracking-tight text-foreground">
                Take &amp; Bring
              </span>
              <span className="ml-1 rounded-[8px] bg-surface-container px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Business
              </span>
            </Link>
            <div className="hidden h-4 w-px bg-outline sm:block" />
            <span className="hidden items-center rounded-full bg-surface-container px-2 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex">
              Onboarding Step 3 / Activation
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={brand.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
            >
              take-bring.eu
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center overflow-hidden px-4 pb-10 pt-24 lg:px-8">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 bg-gradient-to-b from-[#ABC629]/20 via-surface-container/30 to-transparent opacity-60 blur-3xl"
          aria-hidden
        />

        {/* Step tracker */}
        <div className="relative z-10 mb-8 w-full max-w-3xl">
          <div className="rounded-[8px] bg-surface-low p-2 shadow-sm sm:p-4">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="flex items-center gap-2 rounded-[8px] bg-card/80 p-2 shadow-sm">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-container/40 text-success">
                  <CheckCircle2 className="size-[18px]" aria-hidden />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-success sm:block">
                    Step 01
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground">
                    Role Selected
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[8px] bg-card/80 p-2 shadow-sm">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-container/40 text-success">
                  <CheckCircle2 className="size-[18px]" aria-hidden />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-success sm:block">
                    Step 02
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground">
                    Compliance
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[8px] bg-primary-container p-2 text-on-primary-container shadow-sm ring-1 ring-brand-dark/20">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-on-primary-container text-xs font-bold text-primary-container">
                  3
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="hidden text-[11px] font-bold uppercase tracking-wider opacity-80 sm:block">
                    Active Step
                  </span>
                  <span className="truncate text-xs font-bold">
                    Activation &amp; KYC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status card */}
        <div className="relative z-10 w-full max-w-[620px] overflow-hidden rounded-[8px] bg-card p-4 shadow-md sm:p-6">
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-[#ABC629] via-brand-dark to-[#D5E97D]" />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-high px-2.5 py-1 text-[11px] font-semibold tracking-wide text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              ACCOUNT CREATED SUCCESSFULLY
            </div>
            <div className="rounded bg-surface-low px-2 py-0.5 font-mono text-[11px] tracking-tight text-muted-foreground">
              REF: <span className="font-semibold text-foreground">{refCode}</span> •{" "}
              <span className="font-semibold text-success">LIVE</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
                  KYC verification in progress
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your European commercial logistics profile has been registered. Our
                  Frankfurt dispatch compliance desk is actively reviewing your submitted
                  entity documents.
                </p>
              </div>
              <div className="hidden size-12 shrink-0 items-center justify-center rounded-[8px] bg-surface-low text-brand-dark sm:flex">
                <ShieldCheck className="size-7" aria-hidden />
              </div>
            </div>
          </div>

          {/* Dual-channel status */}
          <div className="mb-4 flex flex-col justify-between gap-2 rounded-[8px] bg-surface-low p-3 sm:flex-row sm:items-center sm:p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-dark opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-brand-dark" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  UNDER REVIEW
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Dispatch Desk Session Queue: #14
                </span>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded bg-surface-high/60 px-2 py-1 text-[11px] font-semibold tracking-wider text-foreground sm:self-auto">
              <Timer className="size-3.5 text-brand-dark" aria-hidden />
              EST. RESOLUTION: 2–4 HOURS
            </div>
          </div>

          {/* Gateways */}
          <div className="mb-6">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Automated Clearance Gateways
              </span>
              <span className="text-[11px] font-medium text-success">2 of 3 Cleared</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <div className="flex items-center justify-between rounded-[8px] bg-surface-low p-2.5 sm:flex-col sm:items-start">
                <span className="text-[11px] font-medium text-muted-foreground">
                  EU VIES VAT
                </span>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-success">
                  <Check className="size-3.5" aria-hidden />
                  SYNCHRONIZED
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-surface-low p-2.5 sm:flex-col sm:items-start">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Trade Registry
                </span>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-success">
                  <Check className="size-3.5" aria-hidden />
                  PARSED
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[8px] bg-surface-container p-2.5 sm:flex-col sm:items-start">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Dispatch Rights
                </span>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-brand-dark">
                  <RefreshCw className="size-3.5 animate-spin" aria-hidden />
                  PENDING REVIEW
                </div>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="-mx-4 mb-6 bg-surface-low/40 px-4 pt-4 sm:-mx-6 sm:px-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
              <span className="h-3 w-1.5 rounded-full bg-brand-dark" />
              Next steps during compliance review
            </h2>
            <div className="space-y-4">
              {[
                {
                  n: "01",
                  title: "Automated Document Validation",
                  body: "Cross-referencing EU ERRU haulage registers, commercial court registries, and local tax authorities across member states.",
                },
                {
                  n: "02",
                  title: "SMS & Email Dispatch Notification",
                  body: "You will receive instant clearance via SMS and email as soon as dispatch privileges and carrier search corridors are unlocked.",
                },
                {
                  n: "03",
                  title: "Instant Spot Bidding & Freight Publishing",
                  body: "Immediate access to active pan-European spot freight corridors, electronic bill of lading sync, and automated CMR e-consignment generation.",
                },
              ].map((step) => (
                <div key={step.n} className="group flex items-start gap-2">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-[11px] font-bold text-muted-foreground transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
                    {step.n}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button className="h-12 w-full text-sm font-bold" asChild>
              <Link href={dashboardHref}>
                Go to Business Dashboard
                <ArrowRight />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              (Read-only dispatch preview until KYC approval is completed)
            </p>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[8px] px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-low hover:text-foreground"
              >
                <Upload className="size-[18px]" aria-hidden />
                Upload additional documents later
              </button>
            </div>
          </div>

          {/* Support callout */}
          <div className="mt-4 flex items-start gap-2 rounded-[8px] bg-surface-low p-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-brand-dark">
              <Headset className="size-[18px]" aria-hidden />
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                Need same-day dispatch clearance for an active transport order?
              </span>
              <div className="mt-0.5">
                Call our Frankfurt Compliance Desk at{" "}
                <a
                  className="font-semibold text-brand-dark hover:underline"
                  href="tel:+49408221490"
                >
                  +49 40 8221 490
                </a>{" "}
                <span>(Mon–Fri 06:00 – 22:00 CET)</span>.
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative z-10 mt-6 w-full max-w-2xl text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Lock className="size-3.5 text-success" aria-hidden />
              Strict GDPR Article 28 Compliance
            </div>
            <span className="hidden size-1 rounded-full bg-outline sm:inline-block" />
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              256-bit TLS 1.3 Transport Encryption
            </div>
            <span className="hidden size-1 rounded-full bg-outline sm:inline-block" />
            <div className="flex items-center gap-1">
              <Server className="size-3.5 text-success" aria-hidden />
              ISO 27001 Datacenter Frankfurt
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full bg-surface-low py-4 shadow-[0_-1px_6px_rgba(21,30,16,0.03)]">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground md:flex-row lg:px-8">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            <span>{brand.legalName} • Hamburg, Germany</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>Encrypted TLS 1.3</span>
            <span className="size-1 rounded-full bg-outline" />
            <span className="font-medium text-success">EU VIES Gateway Online</span>
            <span className="size-1 rounded-full bg-outline" />
            <span>GDPR Article 28 Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="size-4 text-outline-strong" aria-hidden />
            <span>Frankfurt AWS eu-central-1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
