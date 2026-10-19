"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground disabled:opacity-60"
      }
    >
      <LogOut className="size-[18px]" aria-hidden />
      <span>{loading ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
