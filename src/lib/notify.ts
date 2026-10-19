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

/**
 * One DB notification + one FCM fan-out per user. Never call create + push separately.
 */
export async function notifyUser(input: NotifyInput) {
  const row = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      payload: input.payload ?? undefined,
    },
  });

  await sendFcmToUser(input.userId, {
    title: input.title,
    body: input.body || "",
    type: input.type,
    href: input.href,
    notificationId: row.id,
    data:
      input.payload && typeof input.payload === "object" && input.payload !== null
        ? Object.fromEntries(
            Object.entries(input.payload as Record<string, unknown>)
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
