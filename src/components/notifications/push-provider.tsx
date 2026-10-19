"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import {
  getFcmToken,
  isPushSupported,
  onForegroundMessage,
} from "@/lib/firebase-client";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function detectDevice() {
  const ua = navigator.userAgent;
  let deviceType = "desktop";
  let platform = "web";
  if (/iPad|Tablet/i.test(ua)) deviceType = "tablet";
  else if (/Mobile|Android|iPhone/i.test(ua)) deviceType = "mobile";
  if (/iPhone|iPad|iPod/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";
  else if (/Mac/i.test(ua)) platform = "macos";
  else if (/Win/i.test(ua)) platform = "windows";
  else if (/Linux/i.test(ua)) platform = "linux";
  return { deviceType, platform };
}

export function PushProvider({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { push } = useToast();
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    setSupported(isPushSupported());
    if ("Notification" in window) {
      setPermission(Notification.permission);
      setEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (!supported || permission !== "granted") return;
    // Auto-register token when already granted (returning users)
    void (async () => {
      const token = await getFcmToken();
      if (!token) return;
      const { deviceType, platform } = detectDevice();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          deviceType,
          platform,
          userAgent: navigator.userAgent,
        }),
      });
      setEnabled(true);
    })();
  }, [supported, permission]);

  useEffect(() => {
    if (!supported) return;
    return onForegroundMessage(({ title, body }) => {
      push(`${title}${body ? ` — ${body}` : ""}`, "success");
    });
  }, [supported, push]);

  async function enable() {
    if (!supported) {
      push(
        "Push not supported here. On iPhone: Add to Home Screen, then enable.",
        "error",
      );
      return;
    }
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        push("Notification permission denied", "error");
        return;
      }
      const token = await getFcmToken();
      if (!token) {
        push("Could not get push token — check HTTPS / browser support", "error");
        return;
      }
      const { deviceType, platform } = detectDevice();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          deviceType,
          platform,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) {
        push("Failed to register device for push", "error");
        return;
      }
      setEnabled(true);
      push("Push notifications enabled", "success");
    } catch {
      push("Failed to enable push", "error");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    try {
      const token = await getFcmToken();
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setEnabled(false);
      push("Push notifications disabled", "success");
    } finally {
      setLoading(false);
    }
  }

  if (!supported && compact) return null;

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void (enabled ? disable() : enable())}
      className={cn(
        compact
          ? "rounded-lg p-1.5 text-muted-foreground hover:bg-surface-high hover:text-foreground"
          : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-surface-low",
        className,
      )}
      title={enabled ? "Disable push" : "Enable push notifications"}
      aria-label={enabled ? "Disable push" : "Enable push"}
    >
      {enabled ? (
        <BellRing className="size-4 text-success" />
      ) : (
        <BellOff className="size-4" />
      )}
      {!compact ? (
        <span>{enabled ? "Push on" : loading ? "…" : "Enable push"}</span>
      ) : null}
    </button>
  );
}
