"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { NotificationsDrawer } from "@/components/notifications/notifications-drawer";
import { PushBootstrap } from "@/components/notifications/push-bootstrap";
import { UnreadBadgeSync } from "@/components/notifications/unread-badge-sync";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Ops Overview", exact: true, icon: LayoutDashboard },
  { href: "/admin/activity", label: "Live Timeline", icon: Activity },
  { href: "/admin/loads", label: "Global Loads", icon: Package },
  { href: "/admin/users", label: "User Directory", icon: Users },
  { href: "/admin/kyc", label: "KYC Review", icon: Shield },
  { href: "/admin/escrow", label: "Escrow Monitor", icon: Wallet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function navActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminChrome({
  children,
  adminName,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  adminName: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveUnread, setLiveUnread] = useState(unreadCount);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setLiveUnread(unreadCount);
  }, [unreadCount]);

  const initials =
    adminName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "SA";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-surface text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col overflow-hidden border-r border-border bg-card md:flex">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-2">
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
          <span className="inline-flex rounded-full bg-primary-container px-2 py-1 text-[11px] font-semibold text-on-primary-container">
            Super Admin Console
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
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
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{adminName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Platform ops
              </p>
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
            <Link href="/admin" className="flex items-center gap-2 md:hidden">
              <LogoMark className="size-7" />
              <span className="text-sm font-bold uppercase">{brand.name}</span>
            </Link>
            <div className="hidden items-center gap-1.5 rounded-lg bg-surface-low px-2 py-1.5 text-[11px] font-medium text-success sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              Platform live · EU corridors
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-[22px]" />
              {liveUnread > 0 ? (
                <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary-container text-[10px] font-bold leading-none text-on-primary-container">
                  {liveUnread > 9 ? "9+" : liveUnread}
                </span>
              ) : null}
            </button>

            <div className="hidden items-center gap-2 border-l border-border pl-2 md:flex">
              <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-secondary-foreground">
                {initials}
              </div>
              <div className="hidden min-w-0 flex-col text-left lg:flex">
                <span className="truncate text-sm font-semibold leading-tight">
                  {adminName}
                </span>
                <span className="truncate text-[11px] leading-tight text-muted-foreground">
                  SUPER_ADMIN
                </span>
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
                href="/admin"
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
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
        title="Platform timeline"
        description="Shipper loads, carrier bids, awards, and delivery events"
        onUnreadChange={setLiveUnread}
      />
      <UnreadBadgeSync onCount={setLiveUnread} />
      <PushBootstrap />
    </div>
  );
}
