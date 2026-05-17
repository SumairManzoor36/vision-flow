import { prisma } from "@/lib/prisma";

type NotificationPayload = {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "alert";
  link?: string | null;
};

/**
 * Best-effort create a notification. Never throws — notifications are non-critical.
 */
export async function notify(payload: NotificationPayload) {
  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? "info",
        link: payload.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed:", err);
  }
}

/**
 * Notify multiple users with the same content (e.g. all managers on completion).
 */
export async function notifyMany(
  userIds: string[],
  payload: Omit<NotificationPayload, "userId">
) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type ?? "info",
        link: payload.link ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifyMany] failed:", err);
  }
}
