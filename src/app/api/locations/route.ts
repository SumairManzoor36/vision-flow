import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession, requireSession } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(1).max(40),
  type: z.enum(["WAREHOUSE", "STORE", "STOCKROOM", "TRANSIT", "OTHER"]).default("WAREHOUSE"),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  manager: z.string().nullable().optional(),
});

export async function GET() {
  try {
    await requireSession();
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: { _count: { select: { stockItems: true, audits: true } } },
      orderBy: { name: "asc" },
    });
    return ok({ locations });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleSession("MANAGER");
    const data = createSchema.parse(await req.json());
    const location = await prisma.location.create({ data });
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "location.created",
        entity: "location",
        entityId: location.id,
      },
    });
    return ok({ location }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
