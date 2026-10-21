import { prisma } from "@/lib/db";
import { getAdminMessaging } from "@/lib/firebase-admin";
import { appBaseUrl } from "@/lib/stripe";

type PushPayload = {
  title: string;
  body: string;
  type: string;
  href?: string;
  notificationId?: string;
  unreadCount?: number;
  data?: Record<string, string>;
};

/**
 * Send FCM once per device. Data-only payload so the service worker
 * shows a single notification (avoids Smart-Supply double-display bug).
 */
export async function sendFcmToUser(userId: string, payload: PushPayload) {
  const messaging = getAdminMessaging();
  if (!messaging) {
    return { sent: 0, failed: 0, total: 0, skipped: true as const };
  }

  const tokens = await prisma.deviceToken.findMany({
    where: { userId, isActive: true },
  });

  if (!tokens.length) {
    return { sent: 0, failed: 0, total: 0 };
  }

  const href = payload.href || "/";
  const absoluteHref = href.startsWith("http")
    ? href
    : `${appBaseUrl()}${href.startsWith("/") ? href : `/${href}`}`;

  const data: Record<string, string> = {
    title: payload.title,
    body: payload.body,
    type: payload.type,
    href: absoluteHref,
    tag: payload.notificationId || payload.type,
    ...(payload.notificationId
      ? { notificationId: payload.notificationId }
      : {}),
    ...(typeof payload.unreadCount === "number"
      ? { unreadCount: String(payload.unreadCount) }
      : {}),
    ...(payload.data || {}),
  };

  let sent = 0;
  let failed = 0;
  const invalidIds: string[] = [];

  await Promise.all(
    tokens.map(async (row) => {
      try {
        await messaging.send({
          token: row.token,
          // data-only → SW shows once (no duplicate system+SW banners)
          data,
          webpush: {
            fcmOptions: { link: absoluteHref },
            headers: { Urgency: "high" },
          },
        });
        sent += 1;
        await prisma.deviceToken.update({
          where: { id: row.id },
          data: { lastSeen: new Date() },
        });
      } catch (e: unknown) {
        failed += 1;
        const code =
          e && typeof e === "object" && "code" in e
            ? String((e as { code: string }).code)
            : "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token") ||
          code.includes("invalid-argument")
        ) {
          invalidIds.push(row.id);
        }
        console.error("[push] send failed", code || e);
      }
    }),
  );

  if (invalidIds.length) {
    await prisma.deviceToken.updateMany({
      where: { id: { in: invalidIds } },
      data: { isActive: false },
    });
  }

  return { sent, failed, total: tokens.length };
}
