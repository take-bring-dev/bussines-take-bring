"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function KycActions({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function decide(status: "APPROVED" | "REJECTED") {
    setLoading(status === "APPROVED" ? "approve" : "reject");
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          status,
          note: status === "REJECTED" ? note : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "KYC update failed", "error");
        return;
      }
      push(
        status === "APPROVED" ? `Approved ${name}` : `Rejected ${name}`,
        "success",
      );
      setRejectOpen(false);
      router.refresh();
    } catch {
      push("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!!loading}
          onClick={() => void decide("APPROVED")}
        >
          {loading === "approve" ? "…" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!loading}
          onClick={() => setRejectOpen(true)}
        >
          Reject
        </Button>
      </div>
      <Sheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject KYC"
        description={`Reason for rejecting ${name}`}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="kyc-note">Reason</Label>
            <Input
              id="kyc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Missing insurance document…"
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="destructive"
              disabled={loading === "reject"}
              onClick={() => void decide("REJECTED")}
            >
              {loading === "reject" ? "…" : "Confirm reject"}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
