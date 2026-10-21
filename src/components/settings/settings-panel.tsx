"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  BellRing,
  Building2,
  Loader2,
  User,
} from "lucide-react";
import { isPushSupported } from "@/lib/firebase-client";
import {
  registerPushToken,
  requestAndRegisterPush,
  unregisterPushToken,
} from "@/lib/push-client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Tab = "profile" | "notifications";

type ProfileUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  shipperProfile?: {
    companyName: string | null;
    vatId: string | null;
    contactName: string;
    invoiceEmail: string;
    billingCity: string;
    billingCountry: string;
  } | null;
  carrierIndividual?: {
    fullName: string;
    vatId: string | null;
    addressCity: string;
    addressCountry: string;
  } | null;
  carrierCompanyAdmin?: {
    companyName: string;
    vatId: string;
    adminPhone: string | null;
    addressCity: string;
    addressCountry: string;
  } | null;
  profile?: { kycStatus: string } | null;
};

export function SettingsPanel({
  title = "Settings",
}: {
  title?: string;
}) {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [pushSupported, setPushSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPushSupported(isPushSupported());
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Save failed", "error");
        return;
      }
      setUser((u) => (u ? { ...u, ...data.user } : u));
      push("Profile updated", "success");
    } catch {
      push("Network error", "error");
    } finally {
      setSaving(false);
    }
  }

  async function enablePush() {
    setPushBusy(true);
    try {
      const res = await requestAndRegisterPush();
      setPermission(
        "Notification" in window ? Notification.permission : "denied",
      );
      if (res.ok) {
        push("Push notifications enabled on this device", "success");
      } else if (res.reason === "denied") {
        push("Permission denied in browser settings", "error");
      } else if (res.reason === "unsupported") {
        push("Not supported — on iPhone use Add to Home Screen first", "error");
      } else {
        push("Could not enable push", "error");
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function disablePush() {
    setPushBusy(true);
    try {
      await unregisterPushToken();
      push("This device unsubscribed from push", "success");
    } finally {
      setPushBusy(false);
    }
  }

  async function refreshToken() {
    setPushBusy(true);
    try {
      const res = await registerPushToken();
      if (res.ok) push("Device re-registered", "success");
      else push("Could not refresh token", "error");
    } finally {
      setPushBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const company =
    user?.shipperProfile?.companyName ||
    user?.carrierCompanyAdmin?.companyName ||
    null;
  const vat =
    user?.shipperProfile?.vatId ||
    user?.carrierCompanyAdmin?.vatId ||
    user?.carrierIndividual?.vatId ||
    null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and notification preferences
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { key: "profile", label: "Profile settings", icon: User },
            { key: "notifications", label: "Notification settings", icon: Bell },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
              tab === key
                ? "bg-primary-container font-bold text-on-primary-container shadow-sm"
                : "bg-surface-low font-medium text-muted-foreground hover:bg-surface-high",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Profile</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">Display name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-phone">Phone</Label>
              <Input
                id="settings-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 …"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="rounded-lg border border-border bg-surface-low px-3 py-2 text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>

          {(company || vat) && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                <Building2 className="size-3.5 text-primary" />
                Company
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                {company ? (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Name</p>
                    <p className="font-semibold">{company}</p>
                  </div>
                ) : null}
                {vat ? (
                  <div>
                    <p className="text-[11px] text-muted-foreground">VAT</p>
                    <p className="font-mono font-semibold">{vat}</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {user?.profile?.kycStatus ? (
            <p className="text-xs text-muted-foreground">
              KYC status:{" "}
              <span className="font-semibold text-foreground">
                {user.profile.kycStatus}
              </span>
            </p>
          ) : null}

          <Button disabled={saving} onClick={() => void saveProfile()}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Bell className="size-4 text-primary" />
            <h2 className="text-sm font-bold">Notification settings</h2>
          </div>

          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-low p-4">
            <div className="flex gap-3">
              {permission === "granted" ? (
                <BellRing className="mt-0.5 size-5 text-success" />
              ) : (
                <BellOff className="mt-0.5 size-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">Push on this device</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {!pushSupported
                    ? "Not supported in this browser. On iPhone, add TBD to Home Screen first."
                    : permission === "granted"
                      ? "Browser permission granted — alerts will arrive here."
                      : permission === "denied"
                        ? "Blocked by the browser. Reset site permissions, then enable again."
                        : "Not enabled yet. Allow notifications to get bid and escrow alerts."}
                </p>
                <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                  Status:{" "}
                  <span className="text-foreground">
                    {pushSupported ? permission : "unsupported"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {permission !== "granted" ? (
              <Button
                disabled={pushBusy || !pushSupported}
                onClick={() => void enablePush()}
              >
                {pushBusy ? "Working…" : "Enable notifications"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={pushBusy}
                  onClick={() => void refreshToken()}
                >
                  Refresh device token
                </Button>
                <Button
                  variant="outline"
                  disabled={pushBusy}
                  onClick={() => void disablePush()}
                >
                  Unsubscribe this device
                </Button>
              </>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">
            In-app alerts always appear in the bell drawer. Push is per device —
            enable on each phone or laptop you use.
          </p>
        </div>
      ) : null}
    </div>
  );
}
