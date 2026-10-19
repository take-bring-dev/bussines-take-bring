"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Shield,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: string };

const navByRole: Record<"shipper" | "carrier" | "admin", NavItem[]> = {
  shipper: [
    { href: "/s", label: "Overview", icon: LayoutDashboard },
    { href: "/s/loads", label: "Loads", icon: Package },
    { href: "/s/notifications", label: "Alerts", icon: Bell },
  ],
  carrier: [
    { href: "/c", label: "Overview", icon: LayoutDashboard },
    { href: "/c/loads", label: "Open loads", icon: Package },
    { href: "/c/fleet", label: "Fleet", icon: Truck },
    { href: "/c/notifications", label: "Alerts", icon: Bell },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/kyc", label: "KYC", icon: Shield },
    { href: "/admin/loads", label: "Loads", icon: Package },
  ],
};

const roleLabel = {
  shipper: "Shipper Workspace",
  carrier: "Carrier Dispatch",
  admin: "Admin Console",
} as const;

function isActive(pathname: string, href: string) {
  const exactHome = href === "/s" || href === "/c" || href === "/admin";
  if (exactHome) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  role,
  title,
  children,
  subtitle,
}: {
  role: "shipper" | "carrier" | "admin";
  title: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navByRole[role];
  const showFab = role === "shipper" && !pathname.includes("/loads/new");
  const alertsHref =
    role === "shipper" ? "/s/notifications" : role === "carrier" ? "/c/notifications" : "/admin";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-surface text-foreground">
      {/* Desktop sidebar — Stitch shipper workspace */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col justify-between border-r border-border bg-surface p-3 md:flex">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-container">
              <LogoMark className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-bold tracking-tight">{brand.name}</span>
                <span className="rounded border border-border/50 bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Business
                </span>
              </div>
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {roleLabel[role]}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="size-2 shrink-0 rounded-full bg-primary-container ring-2 ring-primary-container/30" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold">{role === "admin" ? "Platform" : "EU Spot"}</p>
                <p className="truncate text-[10px] text-muted-foreground">Verified account</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-l-2 border-primary-container bg-surface-container text-foreground"
                      : "border-l-2 border-transparent text-muted-foreground hover:bg-surface-high hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-4", active && "text-primary-container")}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 pt-2">
          <div className="flex gap-1">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-surface-high"
            >
              <Settings className="size-3.5" />
              Settings
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-destructive hover:bg-error-container/40"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-60">
        {/* Top bar — Stitch */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary-container">
                <LogoMark className="h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">{title}</h1>
              {subtitle ? (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 rounded border border-border bg-card px-2 py-1 sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-container opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                EU Market: <span className="text-foreground">Active</span>
              </span>
            </div>
            <Link
              href={alertsHref}
              className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-container"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
            </Link>
            {role === "shipper" ? (
              <Link
                href="/s/loads/new"
                className="hidden items-center gap-1.5 rounded border border-[#b7d336] bg-primary-container px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-secondary-container md:inline-flex"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                New load
              </Link>
            ) : null}
          </div>
        </header>

        <main className="p-3 pb-28 sm:p-4 md:p-5 md:pb-8">{children}</main>

        {/* Mobile FAB — Stitch “New Load” */}
        {showFab ? (
          <Link
            href="/s/loads/new"
            className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-primary-container px-4 text-sm font-bold text-foreground shadow-[0_4px_12px_rgba(26,31,22,0.15)] md:hidden"
          >
            <Plus className="size-5" strokeWidth={2.5} />
            New Load
          </Link>
        ) : null}

        {/* Mobile bottom nav — Stitch pill active */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card px-3 py-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden">
          {items.slice(0, 4).map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 min-w-11 flex-col items-center justify-center px-3 py-1 transition-transform active:scale-95",
                  active
                    ? "rounded-full bg-primary-container text-on-primary-container"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("mt-0.5 text-[10px]", active && "font-bold")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
