"use client";

import { useEffect } from "react";
import { useLivePoll } from "@/hooks/use-live-poll";
import { setAppBadge } from "@/lib/app-badge";
import { isPushSupported, onForegroundMessage } from "@/lib/firebase-client";

/**
 * Keeps the PWA / home-screen icon badge in sync with unread notifications.
 * Also bumps the badge when a foreground FCM message arrives.
 */
export function UnreadBadgeSync({
  onCount,
}: {
  onCount?: (count: number) => void;
}) {
  const { data, refresh } = useLivePoll<{ unreadCount: number }>(
    "/api/notifications",
    { intervalMs: 8000 },
  );
  const count = data?.unreadCount ?? 0;

  useEffect(() => {
    void setAppBadge(count);
    onCount?.(count);
  }, [count, onCount]);

  useEffect(() => {
    if (!isPushSupported()) return;
    return onForegroundMessage(({ data }) => {
      const fromPush = data?.unreadCount ? Number(data.unreadCount) : NaN;
      if (Number.isFinite(fromPush)) {
        void setAppBadge(fromPush);
        onCount?.(fromPush);
      } else {
        void refresh();
      }
    });
  }, [onCount, refresh]);

  return null;
}
