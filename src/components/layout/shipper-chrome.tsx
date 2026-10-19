"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { PushProvider } from "@/components/notifications/push-provider";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/s",
    label: "Marketplace Loads",
    exact: true,
    icon: LayoutDashboard,
  },
  { href: "/s/loads", label: "Active Contracts", icon: Package },
  { href: "/s/billing", label: "Billing & Escrow", icon: FileText },
] as const;

function navActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShipperChrome({
  children,
  companyName,
  vatId,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  companyName: string;
  vatId?: string | null;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const initials =
    companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "TB";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const showPublish = !pathname.includes("/loads/new");

  return (
    <div className="min-h-svh bg-surface text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col overflow-hidden border-r border-border bg-card md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <Link href="/s" className="flex min-w-0 items-center gap-2">
            <LogoMark className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight uppercase">
                {brand.name}
              </p>
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase">
                Business
              </p>
            </div>
          </Link>
        </div>

        <div className="px-3 pt-3">
          <span className="inline-flex rounded-lg bg-surface-container px-2 py-1 text-[11px] font-medium text-muted-foreground">
            Shipper Dispatch
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-hidden px-3 py-3">
          {NAV.map((item) => {
            const active = navActive(
              pathname,
              item.href,
              "exact" in item && item.exact,
            );
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary-container font-semibold text-on-primary-container shadow-sm"
                    : "font-medium text-muted-foreground hover:bg-surface-high hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", active && "text-primary")}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-border/60 p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{companyName}</p>
              {vatId ? (
                <p className="truncate text-[11px] text-muted-foreground">
                  {vatId}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-destructive hover:bg-error-container/40"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-svh flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur-xl md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-high md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/s" className="flex items-center gap-2 md:hidden">
              <LogoMark className="size-7" />
              <span className="text-sm font-bold uppercase">{brand.name}</span>
            </Link>
            <div className="hidden items-center gap-1.5 rounded-lg bg-surface-low px-2 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              VIES & GPS Online
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <PushProvider compact />
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[22px]" />
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold leading-none text-on-primary-container">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {showPublish ? (
              <Link
                href="/s/loads/new"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-container px-3 text-sm font-semibold text-on-primary-container shadow-sm transition-all hover:bg-brand-light"
              >
                <Plus className="size-[18px]" strokeWidth={2.5} />
                <span className="hidden sm:inline">Publish Load</span>
              </Link>
            ) : null}

            <div className="hidden items-center gap-2 border-l border-border pl-2 md:flex">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="hidden min-w-0 flex-col text-left lg:flex">
                <span className="truncate text-sm font-semibold leading-tight">
                  {companyName}
                </span>
                {vatId ? (
                  <span className="truncate text-[11px] leading-tight text-muted-foreground">
                    {vatId}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-surface pb-8">
          {children}
        </main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-hidden bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Link
                href="/s"
                className="flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <LogoMark className="size-8" />
                <span className="text-sm font-bold uppercase">{brand.name}</span>
              </Link>
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-high"
                onClick={() => setMenuOpen(false)}
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-hidden p-3">
              {NAV.map((item) => {
                const active = navActive(
                  pathname,
                  item.href,
                  "exact" in item && item.exact,
                );
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm",
                      active
                        ? "bg-primary-container font-semibold text-on-primary-container"
                        : "font-medium text-muted-foreground hover:bg-surface-high",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-destructive hover:bg-error-container/40"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        description="Bids, awards, escrow, and delivery alerts"
      />
    </div>
  );
}
