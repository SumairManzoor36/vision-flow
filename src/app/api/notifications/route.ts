import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireSession } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "1";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10) || 20,
      50
    );

    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.user.id,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    return ok({ items, unreadCount });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH() {
  try {
    const session = await requireSession();
    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
