"use client";

import { Badge } from "@/components/ui/badge";

export function LiveIndicator({ updatedAt }: { updatedAt?: Date | null }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1.5 font-normal">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Live
      </Badge>
      {updatedAt ? (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Updated {updatedAt.toLocaleTimeString("de-DE")}
        </span>
      ) : null}
    </div>
  );
}
