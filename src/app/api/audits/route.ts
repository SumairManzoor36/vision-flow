import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession, requireSession } from "@/lib/api";
import { generateAuditCode } from "@/lib/utils";

const createSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional().nullable(),
  locationId: z.string().min(1),
  method: z.enum(["AI_VISION", "BARCODE_SCAN", "MANUAL", "HYBRID"]).default("AI_VISION"),
  scheduledAt: z.string().datetime().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const locationId = searchParams.get("locationId") ?? undefined;
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    const audits = await prisma.audit.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(locationId ? { locationId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { code: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        location: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true, scans: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ok({ audits });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleSession("AUDITOR");
    const body = await req.json();
    const data = createSchema.parse(body);

    const audit = await prisma.audit.create({
      data: {
        code: generateAuditCode(),
        title: data.title,
        description: data.description ?? null,
        locationId: data.locationId,
        method: data.method,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: session.user.id,
        assignedToId: data.assignedToId ?? session.user.id,
        status: "DRAFT",
      },
      include: { location: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "audit.created",
        entity: "audit",
        entityId: audit.id,
        metadata: { title: audit.title, code: audit.code },
      },
    });

    return ok({ audit }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
