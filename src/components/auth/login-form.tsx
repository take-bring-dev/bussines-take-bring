"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  FileText,
  Lock,
  Mail,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RoleTab = "operator" | "admin";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [role, setRole] = useState<RoleTab>("operator");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAttempt((n) => n + 1);
        setError(
          data.error ||
            "Invalid email or password. After several unsuccessful attempts, your account may be temporarily locked.",
        );
        return;
      }
      const next = search.get("next") || data.redirectTo || "/s";
      router.push(next);
      router.refresh();
    } catch {
      setAttempt((n) => n + 1);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const hasError = Boolean(error);

  return (
    <div className="relative w-full max-w-[460px]">
      <div className="rounded-[8px] border border-outline bg-card p-6 shadow-sm sm:p-8">
        {/* Meta bar */}
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 rounded bg-surface-low px-2.5 py-1 text-muted-foreground">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-[#ABC629]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
              EU B2B Freight Portal
            </span>
          </div>
          {hasError ? (
            <div className="inline-flex items-center gap-1 rounded bg-error-container px-2 py-0.5 text-[11px] font-semibold text-destructive">
              <ShieldCheck className="size-3.5" aria-hidden />
              Attempt {Math.min(attempt, 5)} of 5
            </div>
          ) : (
            <span className="font-mono text-[11px] text-outline-strong">SYS-AUTH v2.4</span>
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to Business Portal
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Unified freight dispatch access for licensed European shippers, motor
            carriers, and dispatchers.
          </p>
        </div>

        {/* Role tabs (UI preference only — auth is email-based) */}
        <div className="mb-6 flex items-center gap-1 rounded-[8px] bg-surface-low p-1">
          {(
            [
              { id: "operator", label: "Shipper & Carrier" },
              { id: "admin", label: "Company Admin" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRole(tab.id)}
              className={cn(
                "flex-1 rounded px-3 py-1.5 text-center text-xs transition-all",
                role === tab.id
                  ? "bg-card font-semibold text-foreground shadow-sm"
                  : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error banner (Stitch Module H) */}
        {hasError ? (
          <div
            className="mb-6 flex items-start gap-2 rounded-[8px] bg-error-container p-4 shadow-sm"
            role="alert"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-white">
              !
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 text-sm font-semibold leading-tight text-[#93000A]">
                Authentication Failed
              </div>
              <div className="text-xs leading-normal text-[#93000A]/90">{error}</div>
            </div>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit} noValidate={hasError}>
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Business Email Address
            </label>
            <div className="relative flex items-center">
              <Mail
                className="pointer-events-none absolute left-3 size-[18px] text-outline-strong"
                aria-hidden
              />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.eu"
                className="pl-9"
                aria-invalid={hasError || undefined}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-xs font-medium text-foreground"
              >
                Password
              </label>
              <span className="text-[11px] font-medium text-brand-dark">
                Forgot password?
              </span>
            </div>
            <div className="relative flex items-center">
              <Lock
                className="pointer-events-none absolute left-3 size-[18px] text-outline-strong"
                aria-hidden
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                minLength={10}
                placeholder="••••••••••••"
                className="pl-9 pr-14 tracking-wider"
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? "password-error" : undefined}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-outline-strong transition-colors hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
            {hasError ? (
              <div
                id="password-error"
                className="flex items-center gap-1 pt-1 text-destructive"
              >
                <span className="text-[11px] font-medium">
                  The password entered does not match our records. Please verify
                  caps lock or try again.
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 pt-0.5">
            <label className="flex cursor-pointer select-none items-center gap-2.5">
              <input
                type="checkbox"
                name="remember"
                defaultChecked
                className="size-4 cursor-pointer rounded accent-[#556500]"
              />
              <span className="text-xs text-foreground">
                Remember this device for 30 days
              </span>
            </label>
            <div className="flex items-center gap-1.5 pl-6 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              <span>Secure JWT session · KYC enforced after sign-in</span>
            </div>
          </div>

          <Button
            type="submit"
            className="mt-4 h-11 w-full text-sm"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In to Business Portal"}
            {!loading ? <ArrowRight /> : null}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="h-px w-full bg-surface-high" />
          </div>
          <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            New to Take &amp; Bring Business?
          </span>
        </div>

        <Link
          href="/register"
          className="group flex w-full flex-col items-center justify-center gap-0.5 rounded-[8px] bg-surface-low p-4 text-center transition-all hover:bg-surface-container"
        >
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-dark">
            <span>Create Business Account</span>
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            <span>Instant VIES VAT verification · Free dispatch account</span>
          </div>
        </Link>

        <div className="mt-6 flex items-center justify-between pt-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Server className="size-3.5" aria-hidden />
            EU-CENTRAL-1A
          </span>
          <span className="font-mono text-outline-strong">EORI compliant</span>
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <BadgeCheck className="size-[15px] text-brand-dark" aria-hidden />
            <span>EU VIES Verified</span>
          </div>
          <span className="text-outline-strong">·</span>
          <div className="flex items-center gap-1">
            <FileText className="size-[15px] text-brand-dark" aria-hidden />
            <span>CMR Convention Standard</span>
          </div>
          <span className="text-outline-strong">·</span>
          <div className="flex items-center gap-1">
            <Lock className="size-[15px] text-brand-dark" aria-hidden />
            <span>ISO 27001 · GDPR</span>
          </div>
        </div>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-[11px] text-muted-foreground",
            hasError && "shadow-sm",
          )}
        >
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              hasError ? "animate-ping bg-destructive" : "animate-pulse bg-success",
            )}
          />
          <span>
            Authentication Gateway:{" "}
            <strong className="font-medium text-foreground">
              {hasError ? "Active · Security logging" : "Normal"}
            </strong>{" "}
            (Frankfurt TLS 1.3)
          </span>
        </div>
      </div>
    </div>
  );
}
