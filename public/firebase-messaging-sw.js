/* eslint-disable no-undef */
/**
 * FCM service worker — shows ONE notification per message.
 * Backend sends data-only payloads so the browser does not auto-display
 * a second system notification (fixes Smart-Supply double-push).
 */
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCeUmm_2_GQqYbtcqUq3dNEs2rAzKZA0o0",
  authDomain: "take-bring-business.firebaseapp.com",
  projectId: "take-bring-business",
  storageBucket: "take-bring-business.firebasestorage.app",
  messagingSenderId: "990056844109",
  appId: "1:990056844109:web:9920e27ed558218c514504",
  measurementId: "G-ZBNNWL670D",
});

const messaging = firebase.messaging();

function resolveHref(raw) {
  if (!raw) return self.location.origin + "/";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const path = raw.startsWith("/") ? raw : "/" + raw;
  return self.location.origin + path;
}

function updateBadge(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  try {
    if (n > 0 && self.navigator && self.navigator.setAppBadge) {
      self.navigator.setAppBadge(n);
    } else if (n <= 0 && self.navigator && self.navigator.clearAppBadge) {
      self.navigator.clearAppBadge();
    }
  } catch (_) {
    /* ignore */
  }
}

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.data?.title || payload.notification?.title || "Take & Bring";
  const body =
    payload.data?.body || payload.notification?.body || "";
  const tag =
    payload.data?.tag ||
    payload.data?.notificationId ||
    payload.data?.type ||
    "take-bring";

  updateBadge(payload.data?.unreadCount);

  return self.registration.showNotification(title, {
    body,
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    data: payload.data || {},
    tag,
    renotify: true,
  });
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = resolveHref(event.notification.data?.href);
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate?.(href);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(href);
    }),
  );
});
