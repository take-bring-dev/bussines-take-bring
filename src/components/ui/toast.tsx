"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: string; title: string; kind: ToastKind };

type ToastCtx = {
  push: (title: string, kind?: ToastKind) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

/** Design System v1.0 — Module H */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((title: string, kind: ToastKind = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, title, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-[8px] border-2 bg-white px-4 py-3 text-xs shadow-sm sm:w-80",
              t.kind === "success" && "border-[#2C6A3D]",
              t.kind === "error" && "border-[#BA1A1A]",
              t.kind === "info" && "border-[#556500]",
            )}
          >
            <p
              className={cn(
                "font-bold",
                t.kind === "success" && "text-[#2C6A3D]",
                t.kind === "error" && "text-[#BA1A1A]",
                t.kind === "info" && "text-[#556500]",
              )}
            >
              {t.title}
            </p>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      push: (title: string) => {
        if (typeof window !== "undefined") console.info("[toast]", title);
      },
    };
  }
  return ctx;
}
