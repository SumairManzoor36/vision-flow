import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession, requireSession } from "@/lib/api";

const createSchema = z.object({
  sku: z.string().min(1).max(64),
  name: z.string().min(2).max(200),
  barcode: z.string().max(64).nullable().optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  unit: z.string().max(16).default("pcs"),
  costPrice: z.number().nonnegative().nullable().optional(),
  sellPrice: z.number().nonnegative().nullable().optional(),
  reorderPoint: z.number().int().nonnegative().default(0),
  reorderQty: z.number().int().nonnegative().default(0),
  tags: z.string().max(500).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
                { barcode: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        stockItems: {
          include: { location: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ok({ products });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleSession("MANAGER");
    const data = createSchema.parse(await req.json());
    const product = await prisma.product.create({ data });
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "product.created",
        entity: "product",
        entityId: product.id,
        metadata: { sku: product.sku },
      },
    });
    return ok({ product }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
