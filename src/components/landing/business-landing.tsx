import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FilePlus,
  FileText,
  Gavel,
  Globe,
  IdCard,
  Lock,
  MapPin,
  Scale,
  ScrollText,
  Shield,
  Truck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

const marketing = brand.marketingUrl;

export function BusinessLanding() {
  return (
    <div className="min-h-svh bg-surface text-foreground antialiased">
      <LandingHeader />
      <main className="w-full pt-16">
        <LiveBar />
        <Hero />
        <HowItWorks />
        <RoleCards />
        <TrustStrip />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/90 shadow-[0_1px_8px_rgba(21,30,16,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <a
            href={marketing}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2"
          >
            <div className="flex h-8 items-center justify-center gap-1 rounded-full bg-[#2F3221] px-2">
              <Truck className="size-4 text-[#ABC629]" aria-hidden />
              <span className="text-[12px] font-medium tracking-wider text-[#F1F3DA]">
                T&amp;B
              </span>
            </div>
            <span className="hidden text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-brand-dark sm:inline">
              Take &amp; Bring{" "}
              <span className="text-sm font-semibold text-brand-dark">Business</span>
            </span>
          </a>
          <div className="hidden items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 xl:flex">
            <span className="size-1.5 rounded-full bg-brand-dark" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              EU Freight Marketplace
            </span>
          </div>
          <a
            href={marketing}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <ArrowUpRight className="size-3.5" aria-hidden />
            take-bring.eu
          </a>
        </div>

        <nav className="hidden items-center gap-1 md:flex lg:gap-2" aria-label="Page sections">
          <a
            href="#how-it-works"
            className="rounded-[8px] bg-surface-container px-2 py-1.5 text-sm font-bold text-foreground"
          >
            How it Works
          </a>
          <a
            href="#for-shippers"
            className="px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            For Shippers
          </a>
          <a
            href="#for-carriers"
            className="px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            For Carriers
          </a>
          <a
            href="#security"
            className="px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Security &amp; Compliance
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Sign Up Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function LiveBar() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 pb-2 pt-6 md:px-6 lg:px-8">
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-[8px] border border-outline bg-surface-low px-4 py-1.5 shadow-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
            app.take-bring.eu
          </span>
          <span className="text-xs text-outline-strong">/</span>
          <span className="text-xs font-medium text-muted-foreground">
            Live European Freight Exchange · Direct Spot &amp; Contract Bidding
          </span>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-success">
              <BadgeCheck className="size-[18px]" aria-hidden />
              Regulated EU Cross-Border Logistics
            </div>
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl md:leading-[1.15]">
              The Modern European Freight Marketplace
            </h1>
            <p className="text-xl font-semibold text-brand-dark">
              Shipper posts. Verified carriers bid. Award the best offer in minutes.
            </p>
            <p className="max-w-2xl pt-1 text-base leading-relaxed text-muted-foreground">
              Direct, transparent spot freight across 27 EU member states. Zero
              hidden broker margins, binding CMR legal standards, and verified VIES
              transport fleets.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 pt-1 sm:flex-row sm:items-center">
            <Button size="lg" className="h-12 px-6 text-sm" asChild>
              <Link href="/register">
                Create Business Account
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="h-12 px-6 text-sm" asChild>
              <Link href="/login">
                <Lock className="text-muted-foreground" />
                Shipper &amp; Carrier Login
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Free registration
            </span>
            <span className="text-outline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Instant VAT/VIES verification
            </span>
            <span className="text-outline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              Regulated under CMR convention
            </span>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <HeroMockCard />
        </div>
      </div>
    </section>
  );
}

function HeroMockCard() {
  return (
    <div className="flex w-full flex-col gap-4 rounded-[8px] border border-outline bg-card p-6 shadow-md">
      <div className="flex items-center justify-between border-b border-surface-container pb-2">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-success">
          <span className="size-2 animate-pulse rounded-full bg-success" />
          Receiving offers (3)
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">REF #TB-84920</div>
      </div>

      <div className="flex flex-col gap-2 rounded-[8px] bg-surface-low/60 p-4">
        <div className="flex items-start gap-2">
          <div className="mt-1 flex flex-col items-center">
            <span className="size-3 rounded-full border-2 border-card bg-brand-dark" />
            <span className="h-7 w-0.5 bg-outline" />
            <span className="size-3 rounded-full border-2 border-card bg-success" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>DE-20457 Hamburg Port</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Pick-up: Tomorrow, 07:00
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Logistics Terminal Altenwerder
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>NL-3011 Rotterdam Port</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Delivery: Tomorrow, 17:30
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Maasvlakte Distribution Hub
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-surface-high pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Truck className="size-[15px]" aria-hidden />
            FTL · Curtainsider 13.6m
          </span>
          <span className="font-mono">24,000 kg Payload</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lowest Verified Bid
          </span>
          <span className="text-[11px] font-medium text-success">
            3 transport fleets active
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-bold text-foreground md:text-[32px] md:leading-10">
            € 1,420.00
          </span>
          <span className="text-xs text-muted-foreground">excl. VAT</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-[15px] text-success" aria-hidden />
          Carrier: Spedition Vos Logistics BV (Rating 4.96/5 · 410 trips)
        </div>
      </div>

      <Button className="h-11 w-full text-sm" type="button" tabIndex={-1}>
        Award Load to Vos Logistics
        <BadgeCheck />
      </Button>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: FilePlus,
      title: "1. Shipper Publishes Load",
      body: "Specify pickup and delivery windows across Europe, cargo specs (FTL, LTL, Sprinter, Box), and ADR or tail-lift requirements in under 60 seconds.",
      footerIcon: Zap,
      footer: "Average publish time: 48 seconds",
    },
    {
      n: "02",
      icon: Gavel,
      title: "2. Verified Carriers Bid",
      body: "Licensed, EU-compliant carriers compete with transparent net pricing. Real-time notifications alert you to every new quote without middleman markups.",
      footerIcon: Bell,
      footer: "Instant alerts via Web & SMS",
    },
    {
      n: "03",
      icon: ClipboardCheck,
      title: "3. Shipper Awards ONE Offer",
      body: "Select your preferred carrier based on rate, ETA, and rating. The deal instantly locks with a legally binding digital CMR consignment confirmation.",
      footerIcon: FileText,
      footer: "Automated e-CMR generation",
    },
  ] as const;

  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-[1600px] scroll-mt-20 px-4 py-8 md:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col items-center gap-1.5 text-center">
        <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-dark">
          Seamless Workflow
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
          How Take &amp; Bring Business Works
        </h2>
        <p className="max-w-2xl text-base text-muted-foreground">
          A streamlined 3-step marketplace engineered for rapid operational dispatch
          without brokerage runarounds.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.n}
            className="flex flex-col justify-between rounded-[8px] border border-outline bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-surface-container px-2.5 py-1 font-mono text-[11px] font-bold text-foreground">
                  STEP {step.n}
                </span>
                <div className="flex size-10 items-center justify-center rounded-[8px] bg-surface-low text-brand-dark">
                  <step.icon className="size-[22px]" aria-hidden />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-1.5 border-t border-surface-container pt-2 text-[11px] font-semibold text-success">
              <step.footerIcon className="size-4" aria-hidden />
              <span>{step.footer}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoleCards() {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          id="for-shippers"
          className="flex scroll-mt-20 flex-col justify-between rounded-[8px] border border-outline bg-card p-8 shadow-sm"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-surface-container px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                <span className="size-2 rounded-full bg-brand-dark" />
                Post &amp; Procure Freight
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                FOR INDUSTRIAL SHIPPERS
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-2xl font-bold text-foreground">
                For Shippers &amp; Manufacturers
              </h3>
              <p className="text-sm text-muted-foreground">
                Eliminate predatory broker commissions and source capacity directly
                from audited European transportation carriers.
              </p>
            </div>
            <BenefitList
              color="brand"
              items={[
                <>
                  Cut freight spend by <strong>18-24%</strong> compared to traditional
                  freight forwarders
                </>,
                <>
                  Instant access to <strong>4,200+ pre-vetted</strong> European
                  carriers with active EU licenses
                </>,
                <>
                  Full track &amp; trace with digital CMR &amp; signed Proof of Delivery
                  (POD) receipts
                </>,
                <>
                  Zero subscription fees — pay only when loads are successfully
                  contracted and closed
                </>,
              ]}
            />
          </div>
          <div className="pt-6">
            <Button className="h-11 w-full text-sm" asChild>
              <Link href="/register/shipper">
                Register as Shipper
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div
          id="for-carriers"
          className="flex scroll-mt-20 flex-col justify-between rounded-[8px] border border-outline bg-card p-8 shadow-sm"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-surface-container px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                <span className="size-2 rounded-full bg-success" />
                Fill Empty Return Miles
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                FOR FLEET OWNERS
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-2xl font-bold text-foreground">
                For Fleet Operators &amp; Carriers
              </h3>
              <p className="text-sm text-muted-foreground">
                Keep your trucks loaded with guaranteed direct contracts from
                established shippers. No hidden fees or arbitrary payment delays.
              </p>
            </div>
            <BenefitList
              color="success"
              items={[
                <>
                  Direct access to high-value industrial shippers across Germany,
                  Benelux, &amp; France
                </>,
                <>
                  Guaranteed fast 14-day payment settlement via Take &amp; Bring
                  clearing escrow
                </>,
                <>
                  Direct communication with dispatchers — no deceptive freight
                  brokering or hidden terms
                </>,
                <>
                  Real-time mobile load board with one-click bid submission &amp;
                  driver app integration
                </>,
              ]}
            />
          </div>
          <div className="pt-6">
            <Button variant="secondary" className="h-11 w-full text-sm" asChild>
              <Link href="/register/carrier">
                Join Verified Carrier Network
                <BadgeCheck />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitList({
  items,
  color,
}: {
  items: ReactNode[];
  color: "brand" | "success";
}) {
  const iconClass = color === "brand" ? "text-brand-dark" : "text-success";
  return (
    <div className="flex flex-col gap-2 py-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-container">
            <Check className={`size-3.5 ${iconClass}`} aria-hidden />
          </div>
          <span className="text-sm font-medium text-foreground">{item}</span>
        </div>
      ))}
    </div>
  );
}

function TrustStrip() {
  const pillars = [
    {
      icon: IdCard,
      title: "EU VIES & KYC Verification",
      body: "Every tax ID, EU transport license, and identity document is automatically verified against VIES before platform access is granted.",
    },
    {
      icon: ScrollText,
      title: "CMR Convention Standards",
      body: "All booked transports adhere strictly to international Geneva CMR liability protocols with mandated minimum € 250k cargo insurance.",
    },
    {
      icon: Eye,
      title: "Direct Pricing Transparency",
      body: "0% hidden margin deductions. Shippers see exact carrier bids; carriers receive full awarded payouts without middleman skims.",
    },
    {
      icon: Shield,
      title: "GDPR & Bank-Grade Security",
      body: "Hosted in ISO 27001 certified Frankfurt data centers with end-to-end audit logging and strict EU data privacy compliance.",
    },
  ] as const;

  return (
    <section
      id="security"
      className="mx-auto w-full max-w-[1600px] scroll-mt-20 px-4 py-8 md:px-6 lg:px-8"
    >
      <div className="rounded-[8px] border border-outline bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-2 border-b border-surface-container pb-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                Institutional Trust &amp; European Compliance
              </h3>
              <p className="text-sm text-muted-foreground">
                Built from the ground up for strict European logistics regulations.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-[8px] bg-surface-container px-3 py-1.5 text-[11px] font-semibold text-success">
              <Scale className="size-4" aria-hidden />
              Regulated under German Law (Take &amp; Bring GmbH)
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="flex flex-col gap-1.5 rounded-[8px] bg-surface-low/40 p-2"
              >
                <div className="flex items-center gap-1.5 font-semibold text-brand-dark">
                  <p.icon className="size-5" aria-hidden />
                  <span className="text-sm">{p.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="mx-auto mb-6 w-full max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-[8px] border border-outline bg-surface-container p-8 text-center shadow-sm">
        <div className="flex max-w-2xl flex-col items-center gap-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[32px] md:leading-10">
            Ready to modernize your European freight dispatch?
          </h2>
          <p className="text-base text-muted-foreground">
            Join hundreds of verified industrial shippers and motor carriers today.
            No setup fees, no software lock-in.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link href="/register">
              Create Free Account
              <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="secondary" className="h-11 px-6 text-sm" asChild>
            <Link href="/login">Sign in to Portal</Link>
          </Button>
        </div>
        <div className="pt-1">
          <a
            href={marketing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-brand-dark"
          >
            Return to consumer site take-bring.eu
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="w-full bg-surface-low shadow-[0_-1px_8px_rgba(21,30,16,0.03)]">
      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <div className="flex h-7 items-center justify-center gap-1 rounded-full bg-[#2F3221] px-2">
                <Truck className="size-3.5 text-[#ABC629]" aria-hidden />
                <span className="text-[11px] font-medium tracking-wider text-[#F1F3DA]">
                  T&amp;B
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground">
                Take &amp; Bring{" "}
                <span className="text-sm font-semibold text-brand-dark">GmbH</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              European digital freight routing and spot carrier allocation platform.
              Empowering forwarders and carriers across 27 EU member states.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-4 text-success" aria-hidden />
              <span>Große Elbstraße 145, 22767 Hamburg, Germany</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Platform
            </span>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href="#how-it-works"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </a>
              <Link
                href="/register/shipper"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Shipper Dispatch Portal
              </Link>
              <Link
                href="/register/carrier"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Carrier Load Board
              </Link>
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Spot Freight Index
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Compliance &amp; Legal
            </span>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href={`${marketing}/en/impressum`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Impressum
              </a>
              <a
                href={`${marketing}/en/impressum`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </a>
              <a
                href={`${marketing}/en/datenschutz`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </a>
              <a
                href="#security"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                CMR Convention Standards
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Trust &amp; Verification
            </span>
            <div className="flex flex-col gap-1.5 rounded-[8px] bg-surface-container p-4">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="size-[18px] text-success" aria-hidden />
                <span className="text-xs font-medium text-foreground">
                  EU VAT Compliance Verified
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                VAT ID: DE 349 201 884. Cross-border reverse charge compliant and
                certified CMR e-consignment handling.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-success">
                <span className="size-2 rounded-full bg-success" />
                European Logistics Safety Verified
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 rounded-[8px] bg-surface-high/40 px-4 py-2 md:flex-row">
          <span className="text-xs text-muted-foreground">
            © 2026 Take &amp; Bring GmbH. All rights reserved. Registergericht Hamburg
            HRB 182940.
          </span>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="size-3.5" aria-hidden />
              EU Central (Frankfurt)
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              24/7 Dispatch Control
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
