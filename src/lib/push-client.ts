"use client";

import { getFcmToken, isPushSupported } from "@/lib/firebase-client";

export function detectDevice() {
  const ua = navigator.userAgent;
  let deviceType = "desktop";
  let platform = "web";
  if (/iPad|Tablet/i.test(ua)) deviceType = "tablet";
  else if (/Mobile|Android|iPhone/i.test(ua)) deviceType = "mobile";
  if (/iPhone|iPad|iPod/i.test(ua)) platform = "ios";
  else if (/Android/i.test(ua)) platform = "android";
  else if (/Mac/i.test(ua)) platform = "macos";
  else if (/Win/i.test(ua)) platform = "windows";
  else if (/Linux/i.test(ua)) platform = "linux";
  return { deviceType, platform };
}

export async function registerPushToken() {
  if (!isPushSupported()) return { ok: false as const, reason: "unsupported" };
  if (Notification.permission !== "granted") {
    return { ok: false as const, reason: "permission" as const };
  }
  const token = await getFcmToken();
  if (!token) return { ok: false as const, reason: "token" as const };
  const { deviceType, platform } = detectDevice();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      deviceType,
      platform,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) return { ok: false as const, reason: "subscribe" as const };
  return { ok: true as const, token };
}

export async function unregisterPushToken() {
  const token =
    Notification.permission === "granted" ? await getFcmToken() : null;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function requestAndRegisterPush() {
  if (!isPushSupported()) {
    return { ok: false as const, reason: "unsupported" as const };
  }
  const result = await Notification.requestPermission();
  if (result !== "granted") {
    return { ok: false as const, reason: "denied" as const, permission: result };
  }
  return registerPushToken();
}
