import Link from "next/link";
import { Satellite, Timer, ShieldCheck, Quote } from "lucide-react";
import { brand } from "@/config/brand";
import { LogoMark } from "@/components/brand/logo-mark";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  illustration?: string;
}) {
  return (
    <main className="flex min-h-svh w-full flex-col lg:flex-row">
      {/* Left brand panel — Stitch login */}
      <section className="relative flex flex-col justify-between overflow-hidden border-b border-border bg-surface-low p-5 lg:w-[46%] lg:border-b-0 lg:border-r lg:p-8 xl:w-[45%]">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative z-10">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded border border-outline bg-primary-container shadow-sm">
              <LogoMark className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold uppercase tracking-wider">{brand.name}</span>
                <span className="rounded border border-border bg-surface-highest px-1 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  BUSINESS
                </span>
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Pan-European Freight Exchange
              </p>
            </div>
          </Link>

          <div className="mb-3 inline-flex items-center gap-1.5 rounded border border-border bg-surface-container px-2 py-1 text-xs font-semibold text-primary">
            <span className="size-2 animate-pulse rounded-full bg-primary-container" />
            Spot Forwarding Network · Direct Velocity
          </div>
          <h1 className="mb-3 max-w-xl text-2xl font-semibold tracking-tight leading-tight md:text-[2rem] md:leading-10">
            The spot freight exchange engineered for European velocity.
          </h1>
          <p className="mb-6 max-w-xl text-[0.9375rem] leading-6 text-muted-foreground">
            Instant spot matching between verified shippers and vetted EU carriers.
            Publish → bid → award — the zipmend / DAGO / inTime model.
          </p>

          <div className="mt-4 hidden max-w-xl flex-col gap-2 sm:flex">
            {[
              {
                icon: Satellite,
                label: "Active Fleet Today",
                value: "Vetted EU Carriers",
                tag: "GPS Verified",
              },
              {
                icon: Timer,
                label: "Average Match & Award",
                value: "< 12 Minutes on prime corridors",
                tag: "A3 · A8 · Brenner",
              },
              {
                icon: ShieldCheck,
                label: "Carrier Verification",
                value: "100% EU CMR & Liability Insured",
                tag: "KYC first",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between rounded border border-border bg-card p-3 transition hover:border-primary-container"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded bg-surface-container text-primary">
                    <m.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </p>
                    <p className="text-sm font-semibold">{m.value}</p>
                  </div>
                </div>
                <span className="hidden rounded border border-border bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:inline">
                  {m.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 hidden max-w-xl items-start gap-2 rounded border border-border bg-surface-container p-3 md:flex">
            <Quote className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-xs italic text-foreground">
              “Take & Bring cuts our express spot procurement time from 45 minutes to 8 minutes.”
              <span className="mt-1 block text-[11px] font-semibold not-italic text-muted-foreground">
                — Head of Dispatch, DACH Spedition GmbH
              </span>
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap gap-3 border-t border-border pt-6 text-[11px] font-semibold text-muted-foreground">
          <span>EU Compliant Digital CMR</span>
          <span>·</span>
          <span>ISO 9001 Logistics</span>
          <span>·</span>
          <span>© {new Date().getFullYear()} {brand.legalName}</span>
        </div>
      </section>

      {/* Right auth form */}
      <section className="flex min-h-svh flex-col justify-between bg-surface p-5 lg:w-[54%] lg:p-8 xl:w-[55%]">
        <div className="flex w-full items-center justify-between sm:justify-end gap-3">
          <Link
            href="/register"
            className="text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Need an account? <span className="text-foreground">Sign up →</span>
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="rounded border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="mb-2 flex size-8 items-center justify-center rounded border border-border bg-surface-container">
                <LogoMark className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground lg:text-left">
          Secure JWT session · KYC required before publishing
        </p>
      </section>
    </main>
  );
}
