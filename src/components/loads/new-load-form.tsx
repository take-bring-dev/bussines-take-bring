"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Bookmark,
  CheckCircle2,
  Gavel,
  MapPin,
  Package,
  Rocket,
  Route,
  Save,
  Share2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const BODY_TYPES = [
  { value: "CURTAINSIDER", label: "Curtainsider / Tautliner", hint: "13.6m Standard · 2.70m Int. H", vehicle: "40t" },
  { value: "MEGA", label: "Mega Trailer (100m³)", hint: "3.00m Internal Clear Height", vehicle: "40t" },
  { value: "BOX_RIGID", label: "Box Hard-Wall Van", hint: "High-security / Anti-theft", vehicle: "12t" },
  { value: "FRIGO", label: "Refrigerated Frigo", hint: "ATP Class FRC Certified", vehicle: "24t" },
  { value: "PLATFORM", label: "Open Platform / Flatbed", hint: "Oversize & machinery load", vehicle: "40t" },
  { value: "VAN_EXPRESS", label: "Sprinter / 3.5t Express", hint: "Dedicated urgent courier", vehicle: "van" },
] as const;

const TRAILER_LABELS: Record<string, string> = {
  CURTAINSIDER: "Tautliner 13.6m",
  MEGA: "Mega Trailer (100m³)",
  BOX_RIGID: "Box Hard-Wall",
  FRIGO: "Refrigerated Frigo",
  PLATFORM: "Flatbed Platform",
  VAN_EXPRESS: "Express Sprinter 3.5t",
};

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function dayAfterISO() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function parsePlace(raw: string) {
  const trimmed = raw.trim();
  // e.g. "DE-20457 Hamburg, Altenwerder Port" or "Hamburg"
  const m = trimmed.match(/^([A-Z]{2})-?(\d[\d\s-]*)?\s*([^,]+)?(?:,\s*(.+))?$/i);
  if (m) {
    return {
      country: (m[1] || "DE").toUpperCase(),
      zip: (m[2] || "00000").replace(/\s+/g, "").slice(0, 12) || "00000",
      city: (m[3] || trimmed).trim() || "TBD",
      street: (m[4] || m[3] || trimmed).trim(),
    };
  }
  const parts = trimmed.split(",").map((p) => p.trim());
  return {
    country: "DE",
    zip: "00000",
    city: parts[0] || "TBD",
    street: parts[1] || parts[0] || "TBD",
  };
}

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "09:00"}:00`).toISOString();
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export function NewLoadForm() {
  const router = useRouter();
  const { push } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"draft" | "publish" | null>(null);

  const [originQuery, setOriginQuery] = useState("DE-20457 Hamburg");
  const [destQuery, setDestQuery] = useState("NL-3089 Rotterdam");
  const [originFacility, setOriginFacility] = useState("");
  const [destFacility, setDestFacility] = useState("");
  const [pickupDate, setPickupDate] = useState(tomorrowISO);
  const [pickupTime, setPickupTime] = useState("06:30");
  const [deliveryDate, setDeliveryDate] = useState(dayAfterISO);
  const [deliveryTime, setDeliveryTime] = useState("14:00");
  const [commodity, setCommodity] = useState("");
  const [weightKg, setWeightKg] = useState(24500);
  const [palletCount, setPalletCount] = useState(33);
  const [stackable, setStackable] = useState(false);
  const [hazardous, setHazardous] = useState(false);
  const [tempControl, setTempControl] = useState("AMBIENT");
  const [bodyType, setBodyType] = useState<string>("CURTAINSIDER");
  const [mode, setMode] = useState<"FTL" | "LTL">("FTL");
  const [targetRate, setTargetRate] = useState(1250);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [tailLift, setTailLift] = useState(false);

  const originPreview = useMemo(() => parsePlace(originQuery), [originQuery]);
  const destPreview = useMemo(() => parsePlace(destQuery), [destQuery]);
  const perKm = weightKg > 0 && targetRate > 0 ? targetRate / 492 : 0;

  async function submit(publish: boolean) {
    setError(null);
    setLoading(publish ? "publish" : "draft");

    const origin = parsePlace(originQuery);
    const dest = parsePlace(destQuery);
    const vehicle =
      BODY_TYPES.find((b) => b.value === bodyType)?.vehicle ||
      (weightKg >= 20000 ? "40t" : weightKg >= 7500 ? "7.5t" : "van");

    const notesParts = [
      `bodyType=${bodyType}`,
      `mode=${mode}`,
      tempControl !== "AMBIENT" ? `temp=${tempControl}` : null,
      tailLift ? "tailLift=1" : null,
    ].filter(Boolean);

    const payload = {
      publish,
      reference: `TB-${Date.now().toString().slice(-6)}`,
      title: commodity.trim() || null,
      pickupCity: origin.city,
      pickupZip: origin.zip,
      pickupCountry: origin.country,
      pickupStreet: origin.street,
      pickupCompany: originFacility.trim() || null,
      pickupWindowStart: combineDateTime(pickupDate, pickupTime),
      pickupWindowEnd: combineDateTime(pickupDate, pickupTime),
      deliveryCity: dest.city,
      deliveryZip: dest.zip,
      deliveryCountry: dest.country,
      deliveryStreet: dest.street,
      deliveryCompany: destFacility.trim() || null,
      deliveryWindowStart: combineDateTime(deliveryDate, deliveryTime),
      deliveryWindowEnd: combineDateTime(deliveryDate, deliveryTime),
      cargoDescription: commodity.trim() || "General cargo",
      weightKg,
      palletCount,
      stackable,
      hazardous,
      temperatureControl: tempControl !== "AMBIENT",
      loadingHelpNeeded: loadingHelp || tailLift,
      requiredVehicleClass: vehicle,
      suggestedBudgetEur: targetRate,
      notes: notesParts.join("; "),
    };

    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save load");
        push(data.error || "Could not save load", "error");
        return;
      }
      push(
        publish
          ? "Consignment broadcasted — live on the marketplace"
          : "Draft consignment saved",
        "success",
      );
      router.push(data.load?.id ? `/s/loads/${data.load.id}` : "/s/loads");
      router.refresh();
    } catch {
      setError("Network error");
      push("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Sub-header */}
      <div className="border-b border-border/40 bg-surface-low/70 px-4 py-4 backdrop-blur-md md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-col gap-1.5">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <Link href="/s" className="hover:text-foreground">
                Operations Control Center
              </Link>
              <span>›</span>
              <Link href="/s" className="hover:text-foreground">
                Marketplace Loads
              </Link>
              <span>›</span>
              <span className="font-semibold text-primary">Create New Load</span>
            </nav>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-[32px] md:leading-10">
                Publish New Freight Consignment
              </h1>
              <span className="rounded-full bg-primary-container/40 px-2 py-0.5 text-[11px] font-bold tracking-wide text-on-primary-container uppercase">
                Step 1 of 2 · Specification
              </span>
            </div>
            <p className="max-w-4xl text-sm text-muted-foreground">
              Configure transport corridor, freight dimensions, trailer
              specifications, and spot pricing. Once published, your consignment
              broadcasts to verified European carriers with escrow protection.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
            <Link
              href="/s/loads"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-surface-container px-3 text-sm text-muted-foreground shadow-sm transition-all hover:bg-surface-high hover:text-foreground"
            >
              <X className="size-[18px]" />
              Cancel & Return
            </Link>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void submit(false)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-card px-3 text-sm shadow-sm transition-all hover:bg-surface-container disabled:opacity-50"
            >
              <Save className="size-[18px]" />
              {loading === "draft" ? "Saving…" : "Save as Draft"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-6 px-4 py-8 md:px-6 lg:px-8 xl:grid-cols-12">
        {/* Form column */}
        <form
          className="flex flex-col gap-8 xl:col-span-8"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(true);
          }}
        >
          {/* 1. Corridor */}
          <section className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-surface-low text-primary">
                  <Share2 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    1. Transport Corridor & Scheduling
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Define loading and discharge terminals, time windows, and
                    slot reservations.
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-1 rounded bg-surface-high px-2 py-1 font-mono text-[11px] text-muted-foreground sm:flex">
                <Route className="size-4 text-success" />
                EST. CORRIDOR TRANSIT
              </div>
            </div>

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4 rounded-lg bg-surface-low/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                      A
                    </span>
                    <span className="text-sm font-semibold tracking-wider uppercase">
                      Pickup Location (Origin)
                    </span>
                  </div>
                  <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold">
                    {originPreview.country}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    City / Postal Code
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 size-[18px] text-muted-foreground" />
                    <input
                      required
                      value={originQuery}
                      onChange={(e) => setOriginQuery(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="DE-20457 Hamburg"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">
                    Facility / Terminal / Hub Name
                  </label>
                  <input
                    value={originFacility}
                    onChange={(e) => setOriginFacility(e.target.value)}
                    className="h-10 w-full rounded-lg bg-card px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Terminal / gate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      Pickup Date
                    </label>
                    <input
                      required
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card px-2 font-mono text-xs shadow-sm outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      Earliest Loading Slot
                    </label>
                    <input
                      required
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card px-2 font-mono text-xs shadow-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-lg bg-surface-low/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-success/20 text-[11px] font-bold text-success">
                      B
                    </span>
                    <span className="text-sm font-semibold tracking-wider uppercase">
                      Discharge Location (Delivery)
                    </span>
                  </div>
                  <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold">
                    {destPreview.country}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    City / Postal Code
                  </label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3 size-[18px] text-muted-foreground" />
                    <input
                      required
                      value={destQuery}
                      onChange={(e) => setDestQuery(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card pr-3 pl-9 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="NL-3089 Rotterdam"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-muted-foreground">
                    Consignee Facility Name
                  </label>
                  <input
                    value={destFacility}
                    onChange={(e) => setDestFacility(e.target.value)}
                    className="h-10 w-full rounded-lg bg-card px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Warehouse / gate"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      Target Delivery Date
                    </label>
                    <input
                      required
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card px-2 font-mono text-xs shadow-sm outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-muted-foreground">
                      Latest Slot Deadline
                    </label>
                    <input
                      required
                      type="time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="h-10 w-full rounded-lg bg-card px-2 font-mono text-xs shadow-sm outline-none"
                    />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 pt-1 text-[11px]">
                  <input
                    type="checkbox"
                    checked={tailLift}
                    onChange={(e) => setTailLift(e.target.checked)}
                    className="size-4 rounded accent-[var(--brand-dark)]"
                  />
                  Consignee lacks loading bay (ground-level unloading)
                </label>
              </div>
            </div>
          </section>

          {/* 2. Cargo */}
          <section className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-surface-low text-primary">
                  <Package className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    2. Cargo & Commodity Specifications
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Physical parameters, hazardous classification, packaging.
                  </p>
                </div>
              </div>
              <span className="rounded bg-primary-container/40 px-2 py-0.5 text-[11px] font-semibold text-on-primary-container">
                CMR Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="flex flex-col gap-1 md:col-span-12">
                <label className="text-[11px] text-muted-foreground">
                  Commodity Title & Description
                </label>
                <input
                  required
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  className="h-10 w-full rounded-lg bg-card px-3 text-sm shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  placeholder="Automotive parts, machinery, pallets…"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-muted-foreground">
                    Total Gross Weight (kg)
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      [3500, "3.5t"],
                      [7500, "7.5t"],
                      [12000, "12t"],
                      [24500, "24.5t FTL"],
                    ].map(([w, label]) => (
                      <button
                        key={String(w)}
                        type="button"
                        onClick={() => {
                          setWeightKg(Number(w));
                          setMode(Number(w) >= 20000 ? "FTL" : "LTL");
                        }}
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px]",
                          weightKg === Number(w)
                            ? "bg-primary-container font-bold text-on-primary-container"
                            : "bg-surface-container text-muted-foreground hover:bg-surface-high",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative flex items-center">
                  <input
                    required
                    type="number"
                    min={1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-lg bg-card px-3 font-mono text-base font-bold shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-3 font-mono text-[11px] text-muted-foreground">
                    KG NET
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-6">
                <label className="text-[11px] text-muted-foreground">
                  Loading Units / Pallets
                </label>
                <div className="relative flex items-center">
                  <input
                    required
                    type="number"
                    min={1}
                    max={66}
                    value={palletCount}
                    onChange={(e) =>
                      setPalletCount(Number(e.target.value) || 0)
                    }
                    className="h-10 w-full rounded-lg bg-card px-3 font-mono text-base font-bold shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-3 font-mono text-[11px] text-muted-foreground">
                    EUROPALLETS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-1 md:col-span-12 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-lg bg-surface-low p-2">
                  <div>
                    <p className="text-sm font-semibold">Stackable Pallets</p>
                    <p className="text-xs text-muted-foreground">
                      Allow vertical double-tiering
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={stackable}
                    onClick={() => setStackable((v) => !v)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      stackable ? "bg-primary" : "bg-outline",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                        stackable && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-low p-2">
                  <div>
                    <p className="text-sm font-semibold">Hazardous Goods (ADR)</p>
                    <p className="text-xs text-muted-foreground">
                      Requires certified driver
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={hazardous}
                    onClick={() => setHazardous((v) => !v)}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      hazardous ? "bg-destructive" : "bg-outline",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                        hazardous && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-low p-2">
                  <div>
                    <p className="text-sm font-semibold">Temperature Range</p>
                    <p className="text-xs text-muted-foreground">
                      {tempControl === "AMBIENT" ? "Ambient (Standard)" : tempControl}
                    </p>
                  </div>
                  <select
                    value={tempControl}
                    onChange={(e) => setTempControl(e.target.value)}
                    className="h-8 rounded bg-card px-2 text-[11px] shadow-sm outline-none"
                  >
                    <option value="AMBIENT">Ambient</option>
                    <option value="CHILLED">+2°C to +8°C</option>
                    <option value="FROZEN">-18°C or lower</option>
                    <option value="CONTROLLED">+15°C to +25°C</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Vehicle */}
          <section className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-surface-low text-primary">
                  <Truck className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    3. Vehicle & Equipment Specifications
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select vehicle class and trailer architecture.
                  </p>
                </div>
              </div>
              <div className="inline-flex rounded-lg bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setMode("FTL")}
                  className={cn(
                    "rounded px-3 py-1 text-xs",
                    mode === "FTL"
                      ? "bg-card font-bold shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  FTL (Full)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("LTL")}
                  className={cn(
                    "rounded px-3 py-1 text-xs",
                    mode === "LTL"
                      ? "bg-card font-bold shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  LTL (Part)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BODY_TYPES.map((b) => (
                <label
                  key={b.value}
                  className={cn(
                    "relative flex cursor-pointer items-center gap-2 rounded-lg bg-surface-low p-4 transition-all hover:bg-surface-container",
                    bodyType === b.value && "ring-2 ring-primary-container",
                  )}
                >
                  <input
                    type="radio"
                    name="bodyType"
                    value={b.value}
                    checked={bodyType === b.value}
                    onChange={() => setBodyType(b.value)}
                    className="size-4 accent-[var(--brand-dark)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{b.label}</span>
                    <span className="text-xs text-muted-foreground">{b.hint}</span>
                  </div>
                </label>
              ))}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={loadingHelp}
                onChange={(e) => setLoadingHelp(e.target.checked)}
                className="size-4 rounded accent-[var(--brand-dark)]"
              />
              Loading help / pallet jack required on board
            </label>
          </section>

          {/* 4. Pricing */}
          <section className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-surface-low text-primary">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    4. Spot Market Pricing & Bidding Protocol
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Set your target price to guide carrier bids.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded bg-surface-container px-2 py-1 text-[11px] text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" />
                BaFin Escrow Protected
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="flex flex-col gap-1 md:col-span-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Target Spot Rate (€)
                  </label>
                  <span className="font-mono text-[11px] text-primary">
                    ~€{perKm.toFixed(2)}/km est.
                  </span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-mono text-xs font-bold text-muted-foreground">
                    €
                  </span>
                  <input
                    required
                    type="number"
                    step={10}
                    min={1}
                    value={targetRate}
                    onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
                    className="h-11 w-full rounded-lg bg-card pr-3 pl-8 font-mono text-xl font-bold shadow-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Excl. VAT · EU Reverse Charge Art. 196
                </span>
              </div>
              <div className="flex flex-col justify-end gap-2 md:col-span-6">
                <p className="rounded-lg bg-surface-low p-3 text-xs text-muted-foreground">
                  Spot tendering: carriers submit bids; you review and award one.
                  Publishing opens the marketplace board immediately.
                </p>
              </div>
            </div>
          </section>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2 xl:hidden">
            <button
              type="submit"
              disabled={!!loading}
              className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 text-sm font-bold text-on-primary-container shadow-md disabled:opacity-50"
            >
              <Rocket className="size-5" />
              {loading === "publish" ? "Publishing…" : "Publish Spot Load"}
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => void submit(false)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-surface-container px-4 text-xs font-semibold disabled:opacity-50"
            >
              <Bookmark className="size-4" />
              Draft
            </button>
          </div>
        </form>

        {/* Right rail */}
        <aside className="sticky top-20 flex flex-col gap-6 xl:col-span-4">
          <div className="flex flex-col gap-6 rounded-xl bg-card p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-surface-container pb-2">
              <span className="text-sm font-bold tracking-wider uppercase">
                Consignment Live Summary
              </span>
              <span className="animate-pulse rounded-full bg-primary-container/40 px-2 py-0.5 font-mono text-[11px] font-bold text-on-primary-container">
                LIVE PREVIEW
              </span>
            </div>

            <div className="relative flex h-44 flex-col justify-between overflow-hidden rounded-lg bg-surface-container p-3">
              <div className="z-10 flex items-center justify-between">
                <span className="rounded bg-foreground/85 px-2 py-1 font-mono text-[11px] font-bold text-surface backdrop-blur-sm">
                  {originPreview.city.slice(0, 12)} → {destPreview.city.slice(0, 12)}
                </span>
                <span className="rounded bg-primary-container px-2 py-1 font-mono text-[11px] font-bold text-on-primary-container">
                  LIVE
                </span>
              </div>
              <div className="z-10 flex w-full items-center justify-between px-2">
                <div className="flex flex-col items-center">
                  <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-surface shadow-md">
                    {originPreview.country}
                  </div>
                  <span className="mt-1 rounded bg-card/90 px-1 text-[11px] font-bold">
                    {originPreview.city}
                  </span>
                </div>
                <div className="relative mx-3 flex h-1.5 flex-1 items-center rounded-full bg-primary/40">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                  <Truck className="absolute left-2/3 size-[18px] -translate-x-1/2 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-surface shadow-md">
                    {destPreview.country}
                  </div>
                  <span className="mt-1 rounded bg-card/90 px-1 text-[11px] font-bold">
                    {destPreview.city}
                  </span>
                </div>
              </div>
              <div className="z-10 flex items-center justify-between rounded bg-card/80 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                <span>
                  Pickup {pickupDate} {pickupTime}
                </span>
                <span>
                  Delivery {deliveryDate} {deliveryTime}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 rounded-lg bg-surface-low p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-success">
                  <Gavel className="size-[18px]" />
                  Spot Target Index
                </div>
                <span className="rounded bg-success-container/40 px-2 py-0.5 text-[10px] font-bold text-success uppercase">
                  Ready
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Your target:</span>
                <span className="font-mono text-base font-bold">
                  {formatEuro(targetRate)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between border-b border-surface-container py-1">
                <span className="text-muted-foreground">Pallet Volume</span>
                <span className="font-mono font-semibold">
                  {palletCount} Euro-pallets
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-container py-1">
                <span className="text-muted-foreground">Gross Weight</span>
                <span className="font-mono font-semibold">
                  {weightKg.toLocaleString("de-DE")} kg ({mode})
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-surface-container py-1">
                <span className="text-muted-foreground">Trailer Body</span>
                <span className="font-semibold">
                  {TRAILER_LABELS[bodyType] || bodyType}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Climate Spec</span>
                <span className="font-semibold text-success">
                  {tempControl === "AMBIENT" ? "Ambient" : tempControl}
                  {hazardous ? " · ADR" : " Non-Hazardous"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container p-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Target Spot Budget
                </span>
                <span className="font-mono text-xl font-bold">
                  {formatEuro(targetRate)}
                </span>
              </div>
              <span className="rounded-full bg-primary px-2.5 py-1 font-mono text-[11px] font-bold text-primary-foreground">
                {mode}
              </span>
            </div>

            <div className="hidden flex-col gap-2 pt-1 xl:flex">
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void submit(true)}
                className="flex h-12 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container text-sm font-bold text-on-primary-container shadow-md transition-all hover:bg-brand-light active:scale-[0.98] disabled:opacity-50"
              >
                <Rocket className="size-5" />
                {loading === "publish"
                  ? "Publishing…"
                  : "Publish Spot Load to Marketplace"}
              </button>
              <button
                type="button"
                disabled={!!loading}
                onClick={() => void submit(false)}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container text-xs font-semibold transition-all hover:bg-surface-high disabled:opacity-50"
              >
                <Bookmark className="size-[18px]" />
                {loading === "draft" ? "Saving…" : "Save Consignment as Draft"}
              </button>
            </div>

            <div className="flex flex-col gap-1 rounded-lg bg-surface-low p-2 text-[11px] leading-relaxed text-muted-foreground">
              <div className="flex items-center gap-1 font-semibold text-foreground">
                <Gavel className="size-3.5 text-success" />
                European Freight Compliance Guarantee
              </div>
              <p>
                Publishing opens competitive carrier bidding. Award one offer to
                lock escrow and proceed to e-CMR / dispatch.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
