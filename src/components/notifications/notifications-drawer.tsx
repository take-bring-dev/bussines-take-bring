"use client";

import { useEffect } from "react";
import { Bell, X } from "lucide-react";
import { LiveNotifications } from "@/components/notifications/live-notifications";
import { cn } from "@/lib/utils";

export function NotificationsDrawer({
  open,
  onClose,
  title = "Notifications",
  description = "Live alerts for bids, awards, escrow, and delivery",
  onUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onUnreadChange?: (count: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] transition-[visibility] duration-300",
        open ? "visible" : "invisible pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close notifications"
        className={cn(
          "absolute inset-0 bg-[#1A1F16]/40 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-full flex-col bg-card shadow-2xl transition-transform duration-300 ease-out",
          "sm:max-w-md sm:border-l sm:border-border",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4 sm:h-16">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <Bell className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">
                {title}
              </h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-low px-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-high"
            aria-label="Cancel"
          >
            <X className="size-4" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {open ? (
            <LiveNotifications
              onNavigate={onClose}
              onUnreadChange={onUnreadChange}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}
