import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireSession, HttpError } from "@/lib/api";

const patchSchema = z.object({
  read: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      throw new HttpError("Not found", 404);
    }

    const item = await prisma.notification.update({
      where: { id },
      data: { read: data.read ?? true },
    });
    return ok({ item });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      throw new HttpError("Not found", 404);
    }
    await prisma.notification.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
