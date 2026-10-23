"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function AssignFleetPanel({
  loadId,
  initialVehicleId,
  initialDriverId,
}: {
  loadId: string;
  initialVehicleId?: string | null;
  initialDriverId?: string | null;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [vehicles, setVehicles] = useState<
    { id: string; label: string; plateNumber: string }[]
  >([]);
  const [drivers, setDrivers] = useState<
    { id: string; fullName: string; vehicleId: string | null }[]
  >([]);
  const [vehicleId, setVehicleId] = useState(initialVehicleId || "");
  const [driverId, setDriverId] = useState(initialDriverId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const [vRes, dRes] = await Promise.all([
        fetch("/api/fleet/vehicles"),
        fetch("/api/fleet/drivers"),
      ]);
      if (vRes.ok) {
        const j = await vRes.json();
        setVehicles(j.vehicles || []);
      }
      if (dRes.ok) {
        const j = await dRes.json();
        setDrivers(
          (j.drivers || []).filter(
            (d: { status: string }) => d.status !== "SUSPENDED",
          ),
        );
      }
    })();
  }, []);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/loads/${loadId}/assign-fleet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicleId || null,
          driverId: driverId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Assign failed", "error");
        return;
      }
      push("Driver & truck assigned", "success");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-low p-4">
      <p className="text-sm font-semibold">Assign driver & truck</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="assign-driver">Driver</Label>
          <select
            id="assign-driver"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={driverId}
            onChange={(e) => {
              const id = e.target.value;
              setDriverId(id);
              const d = drivers.find((x) => x.id === id);
              if (d?.vehicleId) setVehicleId(d.vehicleId);
            }}
          >
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assign-truck">Truck</Label>
          <select
            id="assign-truck"
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Select truck</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} ({v.plateNumber})
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button size="sm" disabled={loading} onClick={() => void save()}>
        {loading ? "Saving…" : "Save assignment"}
      </Button>
    </div>
  );
}
