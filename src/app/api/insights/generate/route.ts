import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession } from "@/lib/api";
import { generateInsight } from "@/lib/gemini";

export const maxDuration = 30;

export async function POST(_req: NextRequest) {
  try {
    const session = await requireRoleSession("MANAGER");

    const [products, lowStock, recentAudits, openDiscrepancies] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.stockItem.findMany({
        where: { quantity: { lte: 5 } },
        include: { product: true, location: true },
        take: 10,
      }),
      prisma.audit.findMany({
        where: { status: "COMPLETED" },
        include: { location: true },
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
      prisma.auditItem.findMany({
        where: { resolved: false, status: { in: ["MISSING", "EXTRA", "DAMAGED"] } },
        include: { product: true, audit: { include: { location: true } } },
        take: 20,
      }),
    ]);

    const prompt = `You are an inventory operations AI for Vision Audit Flow Pro.
Analyze the following snapshot and produce 3 actionable insights, each scored by severity (LOW, MEDIUM, HIGH).
Return STRICT JSON: { "insights": [ { "title": string, "category": string, "severity": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "summary": string, "details": string } ] }

SNAPSHOT:
- Active products: ${products}
- Low-stock items (≤5 on hand): ${lowStock
      .map((s) => `${s.product.name} @ ${s.location.name} (${s.quantity})`)
      .join("; ") || "none"}
- Recent completed audits: ${recentAudits.length}
- Open discrepancies (missing/extra/damaged): ${openDiscrepancies.length}
- Top discrepancies: ${openDiscrepancies
      .slice(0, 6)
      .map(
        (d) =>
          `${d.detectedLabel} (${d.status}, ${d.detectedQty} detected) at ${d.audit.location.name}`
      )
      .join("; ") || "none"}

Be concrete and operationally useful. Output JSON only.`;

    const raw = await generateInsight(prompt);
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    }

    let parsed: { insights?: { title: string; category: string; severity: string; summary: string; details?: string }[] } = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    const created = await Promise.all(
      insights.slice(0, 5).map((ins) =>
        prisma.aiInsight.create({
          data: {
            title: ins.title || "Insight",
            category: ins.category || "operations",
            severity:
              (["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).includes(
                ins.severity as never
              )
                ? (ins.severity as never)
                : "MEDIUM",
            summary: ins.summary || "",
            details: ins.details || null,
            modelUsed: "gemini-text",
          },
        })
      )
    );

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ai.insights_generated",
        entity: "insight",
        metadata: { count: created.length },
      },
    });

    return ok({ insights: created });
  } catch (err) {
    return handleError(err);
  }
}
