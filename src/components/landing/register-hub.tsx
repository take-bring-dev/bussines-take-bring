import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Euro,
  Factory,
  FileCheck,
  Lock,
  Percent,
  Shield,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const roles = [
  {
    href: "/register/shipper",
    badge: "Post & Procure Freight",
    tag: "Recommended for Shippers",
    featured: true as const,
    icon: Factory,
    title: "Shipper / Manufacturer",
    subtitle: "Post loads & award binding bids",
    bullets: [
      <>
        Direct access to <strong>4,200+ verified</strong> EU freight carriers
      </>,
      <>Zero subscription fees — pay only on awarded loads</>,
      <>Instant digital CMR & automated bill of lading generation</>,
      <>
        Average bid turnaround time under{" "}
        <strong className="text-brand-dark">8 minutes</strong>
      </>,
    ],
    requires: "Requires: Registered EU Company & VIES VAT ID",
    requiresIcon: BadgeCheck,
    cta: "Continue as Shipper",
    ctaVariant: "default" as const,
  },
  {
    href: "/register/carrier/company",
    badge: "Fleet Bidding",
    tag: null,
    featured: false as const,
    icon: Truck,
    title: "Carrier Company",
    subtitle: "Bid on spot loads with your fleet",
    bullets: [
      <>Access high-value industrial shippers across Germany & EU</>,
      <>
        Guaranteed <strong>14-day payment settlement</strong> via clearing escrow
      </>,
      <>Direct dispatcher communication — 0% hidden middleman skims</>,
      <>Multi-truck dispatch management & automated driver dispatch</>,
    ],
    requires: "Requires: EU Transport License & CMR Insurance",
    requiresIcon: FileCheck,
    cta: "Continue as Carrier Fleet",
    ctaVariant: "default" as const,
    darkCta: true,
  },
  {
    href: "/register/carrier/individual",
    badge: "Single Vehicle / Driver",
    tag: null,
    featured: false as const,
    icon: UserRound,
    title: "Carrier Individual",
    subtitle: "Independent operator / owner-driver",
    bullets: [
      <>Find return loads (FTL/LTL) to eliminate empty transit miles</>,
      <>One-click bid submission directly from smartphone or tablet</>,
      <>Fast-track onboarding for 3.5t sprinters and solo tractors</>,
      <>Instant digital POD upload via mobile driver interface</>,
    ],
    requires: "Requires: Commercial Reg. & Freight Permit",
    requiresIcon: Building2,
    cta: "Continue as Solo Operator",
    ctaVariant: "outline" as const,
  },
] as const;

export function RegisterHub() {
  return (
    <div className="flex min-h-svh flex-col bg-surface text-foreground antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-6">
            <Link
              href="/login"
              className="rounded-[8px] px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
            >
              ← Back to Login
            </Link>
            <div className="hidden h-4 w-px bg-outline sm:block" />
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-[8px] bg-brand-dark text-sm font-bold text-white">
                T
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  T&amp;B Take &amp; Bring
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                  Business Hub
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Onboarding">
            <span className="rounded-[8px] bg-primary-container px-4 py-1 text-xs font-medium text-on-primary-container">
              Registration
            </span>
            <span className="rounded-[8px] px-4 py-1 text-xs text-muted-foreground">
              Verification Status
            </span>
            <span className="rounded-[8px] px-4 py-1 text-xs text-muted-foreground">
              Requirements
            </span>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href="/"
              className="rounded-[8px] px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
            >
              Business Landing
            </Link>
            <a
              href={brand.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[8px] px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
            >
              take-bring.eu ↗
            </a>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 pt-16">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 lg:px-8">
          {/* Title + steps */}
          <div className="flex flex-col justify-between gap-6 border-b border-outline pb-6 md:flex-row md:items-end">
            <div className="flex max-w-2xl flex-col gap-2">
              <div className="inline-flex w-fit items-center gap-1.5 rounded-[8px] border border-[#ABC629] bg-surface-low px-2 py-0.5 text-brand-dark">
                <span className="size-2 animate-pulse rounded-full bg-brand-dark" />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  EU B2B Freight Portal · Onboarding v2.4
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
                Create Business Account
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Select your operational role across 27 EU member states. Verified via
                EU VIES VAT registry &amp; CMR convention compliance.
              </p>
            </div>

            <div className="flex flex-col items-start gap-1.5 self-start rounded-[8px] border border-outline bg-surface-low p-2 md:items-end md:self-auto">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-brand-dark">Step 1 of 3:</span>
                <span className="text-foreground">Role Selection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-[8px] bg-primary-container px-2 py-1 text-on-primary-container">
                  <span className="text-[11px] font-bold">1</span>
                  <span className="text-[11px] font-semibold">Role Selection</span>
                </div>
                <span className="h-0.5 w-3 bg-outline" />
                <div className="flex items-center gap-1.5 rounded-[8px] bg-surface-container px-2 py-1 text-muted-foreground opacity-75">
                  <span className="text-[11px] font-medium">2</span>
                  <span className="hidden text-[11px] sm:inline">Company &amp; VIES</span>
                </div>
                <span className="h-0.5 w-3 bg-outline" />
                <div className="flex items-center gap-1.5 rounded-[8px] bg-surface-container px-2 py-1 text-muted-foreground opacity-75">
                  <span className="text-[11px] font-medium">3</span>
                  <span className="hidden text-[11px] sm:inline">Activation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            {roles.map((role) => (
              <div
                key={role.href}
                className={cn(
                  "group relative flex flex-col justify-between rounded-[8px] bg-card p-6 shadow-sm transition-all hover:shadow-md",
                  role.featured
                    ? "border-2 border-brand-dark"
                    : "border border-outline hover:border-brand-dark",
                )}
              >
                {role.tag ? (
                  <div className="absolute -top-3 left-6">
                    <span className="rounded-[8px] bg-brand-dark px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
                      {role.tag}
                    </span>
                  </div>
                ) : null}

                <div className={cn("flex flex-col gap-4", role.tag && "pt-1")}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-[8px] border border-outline bg-surface-low px-2 py-0.5 text-brand-dark">
                      <span className="size-1.5 rounded-full bg-brand-dark" />
                      <span className="text-[11px] font-medium">{role.badge}</span>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-[8px] bg-surface-container text-brand-dark transition-colors group-hover:bg-primary-container">
                      <role.icon className="size-6" aria-hidden />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">{role.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {role.subtitle}
                    </p>
                  </div>

                  <div className="my-1 h-px w-full bg-surface-high" />

                  <ul className="flex flex-col gap-2 text-sm text-foreground">
                    {role.bullets.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 size-[18px] shrink-0 text-success"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-col gap-4 border-t border-surface-high pt-6">
                  <div className="flex items-center gap-1.5 rounded-[8px] border border-outline bg-surface-low px-2 py-1 text-[11px] text-muted-foreground">
                    <role.requiresIcon
                      className="size-[15px] shrink-0 text-brand-dark"
                      aria-hidden
                    />
                    <span className="truncate">{role.requires}</span>
                  </div>
                  <Button
                    className={cn(
                      "h-10 w-full text-sm",
                      "darkCta" in role &&
                        role.darkCta &&
                        "border-brand-dark bg-brand-dark text-white hover:bg-[#435000] hover:text-white",
                    )}
                    variant={role.ctaVariant}
                    asChild
                  >
                    <Link href={role.href}>
                      {role.cta}
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="w-full rounded-[8px] border border-outline bg-surface-container p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Euro,
                  title: "100% Free Registration",
                  sub: "No hidden recurring SaaS fees",
                },
                {
                  icon: FileCheck,
                  title: "Instant EU VIES Validation",
                  sub: "Automated tax registry checks",
                },
                {
                  icon: Shield,
                  title: "CMR Standard Protocol",
                  sub: "€250,000 carrier liability protection",
                },
                {
                  icon: Percent,
                  title: "Direct Contract Pricing",
                  sub: "0% middleman broker commissions",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-card text-success shadow-sm">
                    <item.icon className="size-[18px]" aria-hidden />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Corridor stats (from second Stitch frame) */}
          <div className="flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[8px] bg-surface-container p-6 md:flex-row">
            <div className="flex max-w-lg flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                Pan-European Corridors
              </span>
              <h3 className="text-lg font-bold text-foreground">
                Connecting 4,200+ verified carriers and manufacturers
              </h3>
              <p className="text-xs text-muted-foreground">
                From Rotterdam to Milan — secure contract signing, e-CMR dispatch, and
                automated cross-border road logistics.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-brand-dark">&lt; 14 min</span>
                <span className="text-[11px] text-muted-foreground">Avg. First Bid</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">27</span>
                <span className="text-[11px] text-muted-foreground">EU Member States</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-success">99.4%</span>
                <span className="text-[11px] text-muted-foreground">On-Time Execution</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 py-2 text-center">
            <p className="text-sm text-foreground">
              Already registered with Take &amp; Bring Business?
              <Link
                href="/login"
                className="ml-1 font-semibold text-brand-dark underline underline-offset-4 transition-colors hover:text-on-primary-container"
              >
                Log in to your portal →
              </Link>
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Registering an enterprise fleet of &gt;50 vehicles?</span>
              <a
                href="mailto:support@take-bring.eu"
                className="font-medium text-brand-dark hover:underline"
              >
                Contact Carrier Onboarding Desk
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-surface-low shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-2 px-4 py-4 text-muted-foreground md:flex-row lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] md:justify-start">
            <span>© 2026 {brand.legalName}</span>
            <span>·</span>
            <span>Hamburg HRB 182940</span>
            <span>·</span>
            <span>EU Central (Frankfurt)</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5 text-success" aria-hidden />
              Encrypted TLS 1.3
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-outline bg-surface-container px-2 py-1">
            <span className="size-2 rounded-full bg-success" />
            <span className="text-[11px] font-medium text-success">
              Operational · v2.4-eu
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
