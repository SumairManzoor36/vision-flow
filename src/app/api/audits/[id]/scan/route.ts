import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession } from "@/lib/api";
import { analyzeImage, VISION_MODEL } from "@/lib/gemini";
import { saveImageFromDataUrl, dataUrlToBase64 } from "@/lib/upload";

export const maxDuration = 60;

const scanSchema = z.object({
  imageDataUrl: z
    .string()
    .startsWith("data:image/", { message: "Must be a base64 image data URL" }),
  notes: z.string().max(1000).optional(),
  context: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleSession("AUDITOR");
    const { id: auditId } = await params;
    const { imageDataUrl, notes, context } = scanSchema.parse(await req.json());

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { location: true },
    });
    if (!audit) {
      return ok({ error: "Audit not found" }, { status: 404 });
    }

    // Save image
    const file = await saveImageFromDataUrl(imageDataUrl);

    // Mark audit as processing
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "PROCESSING",
        ...(audit.startedAt ? {} : { startedAt: new Date() }),
      },
    });

    // Run Gemini Vision
    const { base64, mimeType } = dataUrlToBase64(imageDataUrl);
    const startedAt = Date.now();
    const analysis = await analyzeImage(
      base64,
      mimeType,
      context ?? `Location: ${audit.location.name} (${audit.location.type})`
    );
    const latencyMs = Date.now() - startedAt;

    // Persist scan + items + match against products
    const scan = await prisma.auditScan.create({
      data: {
        auditId,
        imageUrl: file.publicPath,
        mimeType: file.mimeType,
        fileSize: file.size,
        aiProcessed: true,
        aiModel: VISION_MODEL,
        aiLatencyMs: latencyMs,
        rawAiOutput: analysis.raw,
        notes: notes ?? null,
      },
    });

    // Match each detected item to a product by fuzzy name match
    const productCatalog = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true },
    });

    const lowerCatalog = productCatalog.map((p) => ({
      ...p,
      lname: p.name.toLowerCase(),
    }));

    const items = await Promise.all(
      analysis.items.map((det) => {
        const lower = det.label.toLowerCase();
        const matched =
          lowerCatalog.find((p) => p.lname === lower) ||
          lowerCatalog.find(
            (p) => lower.includes(p.lname) || p.lname.includes(lower)
          );

        return prisma.auditItem.create({
          data: {
            auditId,
            scanId: scan.id,
            productId: matched?.id ?? null,
            detectedLabel: det.label,
            detectedQty: det.quantity,
            expectedQty: 0,
            status: matched ? "DETECTED" : "UNKNOWN",
            confidence: det.confidence,
            boundingBox: det.boundingBox as never,
            notes: det.notes ?? null,
          },
        });
      })
    );

    // Update audit aggregates + move to REVIEW
    const totals = await prisma.auditItem.aggregate({
      where: { auditId },
      _sum: { detectedQty: true },
      _count: true,
    });

    const expectedStock = await prisma.stockItem.findMany({
      where: { locationId: audit.locationId },
      include: { product: true },
    });
    const expectedMap = new Map(
      expectedStock.map((s) => [s.productId, s.quantity])
    );

    // Reconcile: discrepancy = items where detected != expected for that product
    const allItems = await prisma.auditItem.findMany({
      where: { auditId },
    });
    const detectedByProduct = new Map<string, number>();
    for (const it of allItems) {
      if (it.productId) {
        detectedByProduct.set(
          it.productId,
          (detectedByProduct.get(it.productId) ?? 0) + it.detectedQty
        );
      }
    }

    let discrepancies = 0;
    let matched = 0;
    for (const [productId, detectedQty] of detectedByProduct) {
      const expected = expectedMap.get(productId) ?? 0;
      if (detectedQty === expected) matched++;
      else discrepancies++;
    }
    // missing products entirely
    for (const [productId, expectedQty] of expectedMap) {
      if (!detectedByProduct.has(productId) && expectedQty > 0) {
        discrepancies++;
      }
    }

    const updatedAudit = await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "REVIEW",
        totalItems: totals._sum.detectedQty ?? 0,
        matchedItems: matched,
        discrepancies,
        aiConfidence: analysis.overallConfidence,
        aiSummary: analysis.summary,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "audit.scanned",
        entity: "audit",
        entityId: auditId,
        metadata: {
          scanId: scan.id,
          itemsDetected: items.length,
          aiLatencyMs: latencyMs,
          model: VISION_MODEL,
        },
      },
    });

    return ok({
      scan,
      items,
      analysis: {
        summary: analysis.summary,
        overallConfidence: analysis.overallConfidence,
        totalItems: analysis.totalItems,
        warnings: analysis.warnings,
        latencyMs,
      },
      audit: updatedAudit,
    });
  } catch (err) {
    return handleError(err);
  }
}
