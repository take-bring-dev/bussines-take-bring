"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  intervalMs?: number;
  enabled?: boolean;
};

/** Lightweight realtime: poll an endpoint while the tab is visible. */
export function useLivePoll<T>(url: string, options: Options = {}) {
  const { intervalMs = 8000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
      setUpdatedAt(new Date());
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message || "Refresh failed");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();

    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const id = window.setInterval(tick, intervalMs);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", tick);
      abortRef.current?.abort();
    };
  }, [enabled, intervalMs, refresh]);

  return { data, error, loading, updatedAt, refresh };
}
