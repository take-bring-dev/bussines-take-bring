import { Suspense } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in to Business Portal",
  description:
    "Secure sign-in for European shippers, carriers, and company admins on Take & Bring Business.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-surface text-foreground antialiased">
      <header className="fixed top-0 z-50 w-full border-b border-outline/40 bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-[8px] bg-brand-dark text-sm font-bold text-white">
              T&amp;B
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight text-foreground">
                Take &amp; Bring
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark">
                Business
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              ← Business Landing
            </Link>
            <a
              href={brand.marketingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden transition-colors hover:text-foreground sm:inline"
            >
              take-bring.eu ↗
            </a>
          </nav>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-24 md:px-6">
        {/* Subtle dispatch grid */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-40"
          aria-hidden
        >
          <div
            className="h-full w-full max-w-7xl"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(198,200,176,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(198,200,176,0.45) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(circle at 50% 45%, black 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative z-10 flex w-full flex-col items-center py-8">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading sign-in…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <footer className="mt-auto w-full bg-surface-container py-4">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-1 px-4 text-center sm:flex-row sm:text-left md:px-6 lg:px-8">
          <div className="text-xs text-muted-foreground">
            {brand.legalName} · Hamburg HRB 182940 · EU Central (Frankfurt) ·
            Encrypted TLS 1.3
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-success" />
            Operational · v2.4-eu
          </div>
        </div>
      </footer>
    </div>
  );
}
