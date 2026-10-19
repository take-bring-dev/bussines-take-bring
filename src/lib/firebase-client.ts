"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";

function clientConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseApp(): FirebaseApp | null {
  const cfg = clientConfig();
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return null;
  if (getApps().length) return getApps()[0]!;
  return initializeApp(cfg);
}

let messagingPromise: Promise<Messaging | null> | null = null;

export async function getClientMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported().catch(() => false);
      if (!supported) return null;
      const app = getFirebaseApp();
      if (!app) return null;
      return getMessaging(app);
    })();
  }
  return messagingPromise;
}

export async function getFcmToken(): Promise<string | null> {
  const messaging = await getClientMessaging();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error("[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY missing");
    return null;
  }

  // Prefer dedicated messaging SW
  let registration =
    (await navigator.serviceWorker.getRegistration(
      "/firebase-messaging-sw.js",
    )) || null;

  if (!registration) {
    registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );
    await navigator.serviceWorker.ready;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (e) {
    console.error("[fcm] getToken failed", e);
    return null;
  }
}

export function onForegroundMessage(
  cb: (payload: { title: string; body: string; data?: Record<string, string> }) => void,
) {
  let unsub: (() => void) | undefined;

  void getClientMessaging().then((messaging) => {
    if (!messaging) return;
    unsub = onMessage(messaging, (payload) => {
      const title =
        payload.data?.title ||
        payload.notification?.title ||
        "Take & Bring";
      const body =
        payload.data?.body || payload.notification?.body || "";
      cb({ title, body, data: payload.data as Record<string, string> | undefined });
    });
  });

  return () => {
    unsub?.();
  };
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}
