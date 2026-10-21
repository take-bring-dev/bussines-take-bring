"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/realtime/live-indicator";
import { useLivePoll } from "@/hooks/use-live-poll";
import { setAppBadge } from "@/lib/app-badge";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
  href: string | null;
};

export function LiveNotifications({
  onNavigate,
  onUnreadChange,
}: {
  onNavigate?: () => void;
  onUnreadChange?: (count: number) => void;
}) {
  const router = useRouter();
  const { data, updatedAt, refresh, loading } = useLivePoll<{
    notifications: Notification[];
    unreadCount: number;
  }>("/api/notifications", { intervalMs: 5000 });
  const items = data?.notifications ?? [];
  const unread = data?.unreadCount ?? items.filter((n) => !n.readAt).length;

  useEffect(() => {
    void setAppBadge(unread);
    onUnreadChange?.(unread);
  }, [unread, onUnreadChange]);

  async function markAll() {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    const json = (await res.json().catch(() => ({}))) as { unreadCount?: number };
    void setAppBadge(json.unreadCount ?? 0);
    onUnreadChange?.(json.unreadCount ?? 0);
    await refresh();
  }

  async function openNotification(n: Notification) {
    if (!n.readAt) {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        unreadCount?: number;
      };
      if (typeof json.unreadCount === "number") {
        void setAppBadge(json.unreadCount);
        onUnreadChange?.(json.unreadCount);
      }
    }

    onNavigate?.();

    const href = n.href;
    if (href) {
      if (href.startsWith("http")) {
        window.location.href = href;
      } else {
        router.push(href);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LiveIndicator updatedAt={updatedAt} />
          {unread > 0 ? (
            <span className="rounded-full bg-error-container px-2 py-0.5 text-[11px] font-bold text-destructive">
              {unread} new
            </span>
          ) : null}
        </div>
        {unread > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void markAll()}>
            Clear all
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {loading && !items.length ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
        ) : null}
        {!loading && !items.length ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No alerts yet. New load offers, awards, and KYC updates appear here live.
          </div>
        ) : null}
        <div className="divide-y divide-border">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => void openNotification(n)}
              className={cn(
                "block w-full px-4 py-3 text-left transition-colors hover:bg-surface-high",
                !n.readAt && "border-l-2 border-l-primary-container bg-surface-low/60",
              )}
            >
              <p className="text-sm font-semibold">{n.title}</p>
              {n.body ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("de-DE")}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
