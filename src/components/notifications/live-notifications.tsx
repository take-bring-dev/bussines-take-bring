"use client";

import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/realtime/live-indicator";
import { useLivePoll } from "@/hooks/use-live-poll";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export function LiveNotifications() {
  const { data, updatedAt, refresh, loading } = useLivePoll<{
    notifications: Notification[];
  }>("/api/notifications", { intervalMs: 5000 });
  const items = data?.notifications ?? [];
  const unread = items.filter((n) => !n.readAt).length;

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    await refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LiveIndicator updatedAt={updatedAt} />
          {unread > 0 ? (
            <span className="rounded-full bg-error-container px-2 py-0.5 text-[11px] font-bold text-destructive">
              {unread} unread
            </span>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={() => void markAll()}>
          Mark all read
        </Button>
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
            <div
              key={n.id}
              className={cn(
                "px-4 py-3",
                !n.readAt && "border-l-2 border-l-primary-container bg-surface-low/60",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{n.title}</p>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {n.type}
                </span>
              </div>
              {n.body ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
