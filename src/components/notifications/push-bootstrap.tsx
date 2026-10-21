"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  isPushSupported,
  onForegroundMessage,
} from "@/lib/firebase-client";
import {
  registerPushToken,
  requestAndRegisterPush,
} from "@/lib/push-client";
import { setAppBadge } from "@/lib/app-badge";
import { useToast } from "@/components/ui/toast";

const SESSION_KEY = "tbd-push-prompt-shown";

/**
 * Invisible bootstrap: registers FCM when already granted, shows a one-time
 * allow dialog after login when permission is still "default". No header button.
 */
export function PushBootstrap() {
  const { push } = useToast();
  const [askOpen, setAskOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    if (Notification.permission === "granted") {
      void registerPushToken();
      return;
    }

    if (Notification.permission !== "default") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const t = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAskOpen(true);
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;
    return onForegroundMessage(({ title, body, data }) => {
      push(`${title}${body ? ` — ${body}` : ""}`, "success");
      const n = data?.unreadCount ? Number(data.unreadCount) : NaN;
      if (Number.isFinite(n)) void setAppBadge(n);
    });
  }, [push]);

  async function allow() {
    setBusy(true);
    try {
      const res = await requestAndRegisterPush();
      if (res.ok) {
        push("Notifications enabled", "success");
        setAskOpen(false);
      } else if (res.reason === "denied") {
        push("Notifications blocked — enable later in Settings", "error");
        setAskOpen(false);
      } else if (res.reason === "unsupported") {
        push(
          "Push not supported here. On iPhone: Add to Home Screen first.",
          "error",
        );
        setAskOpen(false);
      } else {
        push("Could not enable notifications", "error");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!askOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#1A1F16]/40"
        aria-label="Dismiss"
        onClick={() => setAskOpen(false)}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Enable notifications"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={() => setAskOpen(false)}
          className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-low"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="flex gap-3 pr-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Bell className="size-5" />
          </span>
          <div>
            <p className="text-base font-bold">Allow notifications?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Get alerts for bids, awards, escrow, and delivery updates on this
              device. You can change this anytime in Settings.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => void allow()}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary-container text-sm font-bold text-on-primary-container disabled:opacity-50"
          >
            {busy ? "Enabling…" : "Allow notifications"}
          </button>
          <button
            type="button"
            onClick={() => setAskOpen(false)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border text-sm font-semibold"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
