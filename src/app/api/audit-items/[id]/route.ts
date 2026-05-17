import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession } from "@/lib/api";

const patchSchema = z.object({
  status: z
    .enum(["DETECTED", "MATCHED", "MISSING", "EXTRA", "DAMAGED", "UNKNOWN"])
    .optional(),
  detectedQty: z.number().int().nonnegative().optional(),
  expectedQty: z.number().int().nonnegative().optional(),
  productId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  resolved: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleSession("AUDITOR");
    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    const before = await prisma.auditItem.findUnique({ where: { id } });
    if (!before) return ok({ error: "Not found" }, { status: 404 });

    const item = await prisma.auditItem.update({
      where: { id },
      data,
    });

    if (data.detectedQty !== undefined && before.detectedQty !== data.detectedQty) {
      await prisma.auditItemReview.create({
        data: {
          auditItemId: id,
          reviewerId: session.user.id,
          action: "edited",
          prevQty: before.detectedQty,
          newQty: data.detectedQty,
          comment: data.notes ?? null,
        },
      });
    }

    return ok({ item });
  } catch (err) {
    return handleError(err);
  }
}
