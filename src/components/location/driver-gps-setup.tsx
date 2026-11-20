"use client";

import { useState } from "react";
import { Copy, Link2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DriverGpsSetup({
  driverId,
  driverName,
}: {
  driverId: string;
  driverName: string;
}) {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState<{
    serverUrl: string;
    token: string;
    gpsLoggerUrl: string;
  } | null>(null);

  async function rotate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fleet/drivers/${driverId}/ingest-token`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Could not create GPS link", "error");
        return;
      }
      setCreds({
        serverUrl: data.serverUrl,
        token: data.token,
        gpsLoggerUrl: data.gpsLoggerUrl,
      });
      push("GPS link ready — configure Traccar Client", "success");
    } finally {
      setLoading(false);
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      push(`${label} copied`, "success");
    } catch {
      push("Copy failed", "error");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-low p-3">
      <div>
        <p className="text-xs font-bold">GPS device link (Traccar)</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Reliable tracking when TBD is closed. {driverName} installs Traccar
          Client once and pastes the server URL + device id below.
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs"
        disabled={loading}
        onClick={() => void rotate()}
      >
        <RefreshCw className="size-3.5" />
        {loading ? "Creating…" : creds ? "Rotate GPS link" : "Create GPS link"}
      </Button>

      {creds ? (
        <div className="space-y-2 text-[11px]">
          <Field
            label="Server URL"
            value={creds.serverUrl}
            onCopy={() => void copy(creds.serverUrl, "Server URL")}
          />
          <Field
            label="Device identifier"
            value={creds.token}
            onCopy={() => void copy(creds.token, "Device id")}
          />
          <Field
            label="GPS Logger URL (Android)"
            value={creds.gpsLoggerUrl}
            onCopy={() => void copy(creds.gpsLoggerUrl, "Logger URL")}
          />
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>
              Install{" "}
              <a
                className="font-semibold text-brand-hover underline"
                href="https://www.traccar.org/client/"
                target="_blank"
                rel="noreferrer"
              >
                Traccar Client
              </a>
            </li>
            <li>Paste Server URL + Device identifier</li>
            <li>Allow location Always · unrestricted battery</li>
            <li>Start service — keep Traccar running on trip</li>
          </ol>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link2 className="size-3.5" />
          Create a link to reveal credentials (shown once per rotate).
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Copy className="size-3" />
          Copy
        </button>
      </div>
      <p className="break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
        {value}
      </p>
    </div>
  );
}
