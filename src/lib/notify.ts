import { prisma } from "@/lib/db";
import { sendFcmToUser } from "@/lib/push";
import type { Prisma } from "@prisma/client";

export type NotifyInput = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  payload?: Prisma.InputJsonValue;
  /** In-app / push deep link path, e.g. /s/billing */
  href?: string;
};

function mergePayload(
  payload: Prisma.InputJsonValue | undefined,
  href?: string,
): Prisma.InputJsonValue | undefined {
  const base =
    payload && typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? { ...(payload as Record<string, unknown>) }
      : {};
  if (href) base.href = href;
  return Object.keys(base).length ? (base as Prisma.InputJsonValue) : payload;
}

/**
 * One DB notification + one FCM fan-out per user. Never call create + push separately.
 */
export async function notifyUser(input: NotifyInput) {
  const payload = mergePayload(input.payload, input.href);

  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      payload: payload ?? undefined,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: input.userId, readAt: null },
  });

  await sendFcmToUser(input.userId, {
    title: input.title,
    body: input.body || "",
    type: input.type,
    href: input.href,
    notificationId: row.id,
    unreadCount,
    data:
      payload && typeof payload === "object" && payload !== null
        ? Object.fromEntries(
            Object.entries(payload as Record<string, unknown>)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined,
  });

  return row;
}

export async function notifyUsers(
  userIds: string[],
  input: Omit<NotifyInput, "userId">,
) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results = [];
  for (const userId of unique) {
    results.push(await notifyUser({ ...input, userId }));
  }
  return results;
}

/** Fan-out platform timeline alerts to every active SUPER_ADMIN. */
export async function notifyAdmins(input: Omit<NotifyInput, "userId">) {
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", status: "ACTIVE" },
    select: { id: true },
  });
  if (!admins.length) return [];
  return notifyUsers(
    admins.map((a) => a.id),
    {
      ...input,
      href: input.href ?? "/admin/activity",
    },
  );
}

/** Notify the login user linked to a fleet Driver row (no-op if none). */
export async function notifyDriverById(
  driverId: string | null | undefined,
  input: Omit<NotifyInput, "userId">,
) {
  if (!driverId) return null;
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { userId: true, status: true },
  });
  if (!driver?.userId || driver.status === "SUSPENDED") return null;
  return notifyUser({ ...input, userId: driver.userId });
}
