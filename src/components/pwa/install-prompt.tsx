"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "tbd-pwa-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosMode, setIosMode] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isMobileViewport()) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const ios = isIos();
    setIosMode(ios);

    // Ensure SW is registered (needed for Android Chrome install)
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .catch(() => undefined);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const t = window.setTimeout(() => {
      // Show dialog on mobile even if BIP already fired or iOS (manual steps)
      setOpen(true);
    }, 1600);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  async function install() {
    if (!deferred) {
      setIosMode(true);
      return;
    }
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(STORAGE_KEY, "1");
        setOpen(false);
      }
    } finally {
      setBusy(false);
      setDeferred(null);
    }
  }

  if (!open) return null;

  const canNativeInstall = Boolean(deferred);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-[#1A1F16]/45 backdrop-blur-[1px]"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Install TBD"
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl",
          "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-low"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <Image
            src="/images/icon-192.png"
            alt="TBD"
            width={56}
            height={56}
            className="size-14 rounded-2xl shadow-sm"
            priority
          />
          <div>
            <p className="text-lg font-bold tracking-tight">Install TBD</p>
            <p className="mt-0.5 text-xs font-semibold text-primary">
              Take Bring Dispatching
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add to your home screen for one-tap access and push notifications.
            </p>
          </div>
        </div>

        {(iosMode || !canNativeInstall) && (
          <div className="mt-4 space-y-2 rounded-xl border border-border bg-surface-low p-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">
              {iosMode ? "On iPhone / iPad (Safari)" : "Install from browser menu"}
            </p>
            {iosMode ? (
              <ol className="list-decimal space-y-1 pl-4">
                <li>
                  Tap the{" "}
                  <Share className="mx-0.5 inline size-3.5 text-foreground" />{" "}
                  Share button
                </li>
                <li>
                  Choose{" "}
                  <strong className="text-foreground">Add to Home Screen</strong>
                </li>
                <li>
                  Tap <strong className="text-foreground">Add</strong>
                </li>
              </ol>
            ) : (
              <p>
                Use your browser menu → <strong className="text-foreground">Install app</strong>{" "}
                / <strong className="text-foreground">Add to Home screen</strong>.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {canNativeInstall ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void install()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-container px-4 text-sm font-bold text-on-primary-container disabled:opacity-50"
            >
              <Download className="size-4" />
              {busy ? "Installing…" : "Install / Download"}
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary-container px-4 text-sm font-bold text-on-primary-container"
            >
              Got it
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
