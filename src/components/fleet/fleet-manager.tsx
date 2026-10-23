"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Search, Truck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { formatMoney, formatStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

type Vehicle = {
  id: string;
  label: string;
  plateNumber: string;
  vehicleClass: string;
  payloadKg: number;
  status: string;
  drivers?: { id: string; fullName: string }[];
};

type Driver = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  licenceClass: string | null;
  status: string;
  trackingEnabled: boolean;
  vehicleId: string | null;
  vehicle: { id: string; label: string; plateNumber: string } | null;
  user: {
    id: string;
    email: string;
  } | null;
};

type DriverBid = {
  id: string;
  status: string;
  proposedPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  load: {
    id: string;
    reference: string | null;
    status: string;
    pickupCity: string;
    pickupCountry: string;
    deliveryCity: string;
    deliveryCountry: string;
    weightKg: number;
  };
};

const VEHICLE_OPTIONS = [
  { value: "VAN_3_5T", label: "Van ≤3.5t" },
  { value: "TRUCK_7_5T", label: "Truck 7.5t" },
  { value: "TRUCK_12T", label: "Truck 12t" },
  { value: "TRUCK_24T", label: "Truck 24t" },
  { value: "TRUCK_40T", label: "Truck 40t" },
  { value: "CAR", label: "Car" },
  { value: "OTHER", label: "Other" },
];

type VehicleFilter = "all" | "active" | "idle" | "maintenance";
type DriverSort = "status" | "name" | "vehicle";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function FleetManager({
  companyName,
  initialVehicles,
  initialDrivers,
}: {
  companyName: string;
  initialVehicles: Vehicle[];
  initialDrivers: Driver[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [driverOpen, setDriverOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<VehicleFilter>("all");
  const [driverSort, setDriverSort] = useState<DriverSort>("status");
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [detailBids, setDetailBids] = useState<DriverBid[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"bids" | "wins">("wins");

  const [vForm, setVForm] = useState({
    label: "",
    plateNumber: "",
    vehicleClass: "VAN_3_5T",
    payloadKg: "1500",
  });
  const [dForm, setDForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    licenceClass: "",
    vehicleId: "",
  });

  const q = search.trim().toLowerCase();

  const filteredDrivers = useMemo(() => {
    let list = [...drivers];
    if (q) {
      list = list.filter((d) => {
        const hay = [
          d.fullName,
          d.email,
          d.user?.email,
          d.phone,
          d.licenceClass,
          d.vehicle?.label,
          d.vehicle?.plateNumber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    list.sort((a, b) => {
      if (driverSort === "name") return a.fullName.localeCompare(b.fullName);
      if (driverSort === "vehicle") {
        return (a.vehicle?.label || "zzz").localeCompare(
          b.vehicle?.label || "zzz",
        );
      }
      const rank = (s: string) =>
        s === "ACTIVE" ? 0 : s === "INVITED" ? 1 : 2;
      return (
        rank(a.status) - rank(b.status) || a.fullName.localeCompare(b.fullName)
      );
    });
    return list;
  }, [drivers, q, driverSort]);

  const filteredVehicles = useMemo(() => {
    let list = [...vehicles];
    if (vehicleFilter === "active") {
      list = list.filter((v) => v.status === "ACTIVE");
    } else if (vehicleFilter === "idle") {
      list = list.filter(
        (v) => v.status === "ACTIVE" && !(v.drivers && v.drivers.length),
      );
    } else if (vehicleFilter === "maintenance") {
      list = list.filter((v) => v.status === "MAINTENANCE");
    }
    if (q) {
      list = list.filter((v) => {
        const hay = [
          v.label,
          v.plateNumber,
          v.vehicleClass,
          ...(v.drivers?.map((d) => d.fullName) || []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [vehicles, vehicleFilter, q]);

  const activeDrivers = drivers.filter((d) => d.status === "ACTIVE").length;
  const assignedDrivers = drivers.filter((d) => d.vehicleId).length;

  async function refreshLists() {
    const [vRes, dRes] = await Promise.all([
      fetch("/api/fleet/vehicles"),
      fetch("/api/fleet/drivers"),
    ]);
    if (vRes.ok) {
      const j = await vRes.json();
      setVehicles(j.vehicles);
    }
    if (dRes.ok) {
      const j = await dRes.json();
      setDrivers(j.drivers);
    }
    router.refresh();
  }

  async function createVehicle() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vForm,
          payloadKg: Number(vForm.payloadKg),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setVehicleOpen(false);
      setVForm({
        label: "",
        plateNumber: "",
        vehicleClass: "VAN_3_5T",
        payloadKg: "1500",
      });
      push("Vehicle added", "success");
      await refreshLists();
    } finally {
      setLoading(false);
    }
  }

  async function createDriver() {
    setError(null);
    setTempPassword(null);
    setLoading(true);
    try {
      const res = await fetch("/api/fleet/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dForm,
          vehicleId: dForm.vehicleId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setTempPassword(data.temporaryPassword || null);
      setDForm({
        fullName: "",
        email: "",
        phone: "",
        licenceClass: "",
        vehicleId: "",
      });
      push("Driver created — share the temp password", "success");
      await refreshLists();
    } finally {
      setLoading(false);
    }
  }

  async function assignTruck(driverId: string, vehicleId: string) {
    const res = await fetch(`/api/fleet/drivers/${driverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId: vehicleId || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      push(data.error || "Assign failed", "error");
      return;
    }
    push(vehicleId ? "Truck assigned" : "Truck unassigned", "success");
    await refreshLists();
  }

  async function openDriverDetail(d: Driver) {
    setDetailDriver(d);
    setDetailTab("wins");
    setDetailBids([]);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/fleet/drivers/${d.id}`);
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Could not load driver details", "error");
        return;
      }
      setDetailBids(data.applications || []);
    } finally {
      setDetailLoading(false);
    }
  }

  const vehicleTabs: { id: VehicleFilter; label: string }[] = [
    { id: "all", label: `All (${vehicles.length})` },
    {
      id: "active",
      label: `Active (${vehicles.filter((v) => v.status === "ACTIVE").length})`,
    },
    {
      id: "idle",
      label: `Unassigned (${
        vehicles.filter(
          (v) => v.status === "ACTIVE" && !(v.drivers && v.drivers.length),
        ).length
      })`,
    },
    {
      id: "maintenance",
      label: `Maintenance (${
        vehicles.filter((v) => v.status === "MAINTENANCE").length
      })`,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trucks, plates, drivers…"
          className="h-9 w-full rounded-lg border border-border bg-surface-low py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-hover focus:bg-card focus:outline-none focus:ring-1 focus:ring-brand-hover"
        />
      </div>

      <header className="space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Fleet & Drivers
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {companyName} · vehicles & drivers
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setDriverOpen(true)}
            >
              <UserPlus className="size-3.5" />
              Add driver
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-brand-hover text-xs text-white hover:bg-brand-dark"
              onClick={() => setVehicleOpen(true)}
            >
              <Truck className="size-3.5" />
              Add vehicle
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Vehicles
            </p>
            <p className="text-xl font-bold">{vehicles.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Active drivers
            </p>
            <p className="text-xl font-bold">
              {activeDrivers}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {drivers.length}
              </span>
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:col-span-1">
            <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Assigned trucks
            </p>
            <p className="text-xl font-bold">{assignedDrivers}</p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
            Vehicles
          </h2>
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 text-xs">
            {vehicleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setVehicleFilter(tab.id)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-medium whitespace-nowrap",
                  vehicleFilter === tab.id
                    ? "bg-brand-hover text-white shadow-sm"
                    : "text-muted-foreground hover:bg-surface-low hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {!filteredVehicles.length ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
              No vehicles yet. Add your first truck.
            </div>
          ) : null}
          {filteredVehicles.map((v) => (
            <article
              key={v.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Truck className="size-4 text-muted-foreground" />
                    <h3 className="text-xs font-bold">{v.label}</h3>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {v.plateNumber} · {formatStatus(v.vehicleClass)} ·{" "}
                    {v.payloadKg.toLocaleString()} kg
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Driver:{" "}
                    {v.drivers?.length ? (
                      <span className="font-semibold text-foreground">
                        {v.drivers.map((d) => d.fullName).join(", ")}
                      </span>
                    ) : (
                      <span className="italic">Unassigned</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="text-[11px] font-bold tracking-wider text-foreground uppercase">
            Drivers
          </h2>
          <select
            aria-label="Sort drivers"
            className="rounded-lg border border-border bg-card py-1 pr-7 pl-2 text-xs"
            value={driverSort}
            onChange={(e) => setDriverSort(e.target.value as DriverSort)}
          >
            <option value="status">Status (Active first)</option>
            <option value="name">Name (A–Z)</option>
            <option value="vehicle">Assigned vehicle</option>
          </select>
        </div>

        <div className="space-y-2.5">
          {!filteredDrivers.length ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted-foreground">
              No drivers yet.
            </div>
          ) : null}
          {filteredDrivers.map((d) => {
            const email = d.email || d.user?.email || "No email";
            return (
              <article
                key={d.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between"
              >
                <button
                  type="button"
                  onClick={() => void openDriverDetail(d)}
                  className="flex items-start gap-3 text-left sm:items-center"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#c2dbb5] bg-[#d8e8cf] text-xs font-bold text-[#2c581e]">
                    {initials(d.fullName)}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{d.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {email}
                      {d.phone ? ` · ${d.phone}` : ""}
                      {d.licenceClass ? ` · ${d.licenceClass}` : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-brand-hover">
                      View bids & wins
                    </p>
                  </div>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-border bg-surface-low py-1.5 pr-8 pl-3 text-xs"
                    value={d.vehicleId || ""}
                    onChange={(e) => void assignTruck(d.id, e.target.value)}
                    aria-label={`Assign vehicle to ${d.fullName}`}
                  >
                    <option value="">Unassigned</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} ({v.plateNumber})
                      </option>
                    ))}
                  </select>
                  {d.phone ? (
                    <a
                      href={`tel:${d.phone.replace(/\s+/g, "")}`}
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-surface-low"
                    >
                      <Phone className="size-4" />
                    </a>
                  ) : null}
                  <StatusBadge status={d.status} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Sheet
        open={vehicleOpen}
        onClose={() => setVehicleOpen(false)}
        title="Add vehicle"
        description="Register a truck for your fleet"
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-label">Label</Label>
            <Input
              id="v-label"
              value={vForm.label}
              onChange={(e) =>
                setVForm((s) => ({ ...s, label: e.target.value }))
              }
              placeholder="Sprinter 01"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-plate">Plate number</Label>
            <Input
              id="v-plate"
              value={vForm.plateNumber}
              onChange={(e) =>
                setVForm((s) => ({ ...s, plateNumber: e.target.value }))
              }
              placeholder="B-TB 1234"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-class">Vehicle class</Label>
            <select
              id="v-class"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={vForm.vehicleClass}
              onChange={(e) =>
                setVForm((s) => ({ ...s, vehicleClass: e.target.value }))
              }
            >
              {VEHICLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-payload">Payload (kg)</Label>
            <Input
              id="v-payload"
              type="number"
              min={1}
              value={vForm.payloadKg}
              onChange={(e) =>
                setVForm((s) => ({ ...s, payloadKg: e.target.value }))
              }
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={loading} onClick={() => void createVehicle()}>
            {loading ? "Saving…" : "Save vehicle"}
          </Button>
        </div>
      </Sheet>

      <Sheet
        open={Boolean(detailDriver)}
        onClose={() => {
          setDetailDriver(null);
          setDetailBids([]);
        }}
        title={detailDriver?.fullName || "Driver"}
        description="Bids placed for this driver and loads they won"
        className="max-h-[85vh] sm:max-w-lg"
      >
        {detailDriver ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-surface-low px-3 py-2 text-xs text-muted-foreground">
              <p>
                {detailDriver.email || detailDriver.user?.email || "No email"}
                {detailDriver.phone ? ` · ${detailDriver.phone}` : ""}
              </p>
              <p className="mt-1">
                Truck:{" "}
                {detailDriver.vehicle
                  ? `${detailDriver.vehicle.label} (${detailDriver.vehicle.plateNumber})`
                  : "Unassigned"}
              </p>
            </div>

            <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs">
              {(
                [
                  {
                    id: "wins" as const,
                    label: `Wins (${detailBids.filter((b) => b.status === "ACCEPTED").length})`,
                  },
                  {
                    id: "bids" as const,
                    label: `My bids (${detailBids.filter((b) => b.status === "PENDING").length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDetailTab(tab.id)}
                  className={cn(
                    "flex-1 rounded px-2.5 py-1.5 font-medium",
                    detailTab === tab.id
                      ? "bg-brand-hover text-white"
                      : "text-muted-foreground hover:bg-surface-low",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {detailLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : (
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                {detailBids
                  .filter((b) =>
                    detailTab === "wins"
                      ? b.status === "ACCEPTED"
                      : b.status === "PENDING",
                  )
                  .map((b) => (
                    <li key={b.id}>
                      <Link
                        href={`/c/loads/${b.load.id}`}
                        className="block rounded-xl border border-border bg-card px-3 py-2.5 transition hover:border-brand-hover/40"
                        onClick={() => setDetailDriver(null)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {b.load.pickupCity} → {b.load.deliveryCity}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {b.load.weightKg.toLocaleString()} kg
                              {b.load.reference ? ` · ${b.load.reference}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold">
                              {formatMoney(b.proposedPrice, b.currency)}
                            </p>
                            <StatusBadge status={b.status} />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                {!detailBids.filter((b) =>
                  detailTab === "wins"
                    ? b.status === "ACCEPTED"
                    : b.status === "PENDING",
                ).length ? (
                  <li className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                    {detailTab === "wins"
                      ? "No wins yet for this driver."
                      : "No open bids for this driver."}
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={driverOpen}
        onClose={() => {
          setDriverOpen(false);
          setTempPassword(null);
          setError(null);
        }}
        title="Add driver"
        description="Creates a CARRIER_DRIVER login and optional truck assignment"
      >
        <div className="space-y-3">
          {tempPassword ? (
            <div className="rounded-lg border border-primary/30 bg-surface-low p-3 text-sm">
              <p className="font-semibold">Temporary password</p>
              <p className="mt-1 font-mono text-base">{tempPassword}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Share once. Driver signs in at /login with their email.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => {
                  setDriverOpen(false);
                  setTempPassword(null);
                }}
              >
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="d-name">Full name</Label>
                <Input
                  id="d-name"
                  value={dForm.fullName}
                  onChange={(e) =>
                    setDForm((s) => ({ ...s, fullName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-email">Email (login)</Label>
                <Input
                  id="d-email"
                  type="email"
                  value={dForm.email}
                  onChange={(e) =>
                    setDForm((s) => ({ ...s, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-phone">Phone</Label>
                <Input
                  id="d-phone"
                  value={dForm.phone}
                  onChange={(e) =>
                    setDForm((s) => ({ ...s, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-licence">Licence class</Label>
                <Input
                  id="d-licence"
                  value={dForm.licenceClass}
                  onChange={(e) =>
                    setDForm((s) => ({ ...s, licenceClass: e.target.value }))
                  }
                  placeholder="C / CE"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-truck">Assign truck</Label>
                <select
                  id="d-truck"
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={dForm.vehicleId}
                  onChange={(e) =>
                    setDForm((s) => ({ ...s, vehicleId: e.target.value }))
                  }
                >
                  <option value="">Assign later</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.plateNumber})
                    </option>
                  ))}
                </select>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button disabled={loading} onClick={() => void createDriver()}>
                {loading ? "Creating…" : "Create driver"}
              </Button>
            </>
          )}
        </div>
      </Sheet>
    </div>
  );
}
