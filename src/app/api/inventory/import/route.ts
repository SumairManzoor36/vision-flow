import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession, HttpError } from "@/lib/api";
import { parseCSVToRecords } from "@/lib/csv";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ImportResult = {
  row: number;
  sku: string;
  status: "created" | "updated" | "skipped";
  error?: string;
};

const REQUIRED_HEADERS = ["sku", "name"];
const ALLOWED_HEADERS = [
  "sku",
  "name",
  "barcode",
  "description",
  "category",
  "unit",
  "costprice",
  "sellprice",
  "reorderpoint",
  "reorderqty",
  "tags",
];

function toNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toInt(value: string | undefined): number {
  if (!value || value.trim() === "") return 0;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleSession("MANAGER");

    const form = await req.formData();
    const file = form.get("file");
    const dryRun = form.get("dryRun") === "true";

    if (!file || typeof file === "string") {
      throw new HttpError("CSV file is required", 400);
    }

    const text = await (file as File).text();
    if (!text.trim()) throw new HttpError("CSV file is empty", 400);

    const records = parseCSVToRecords(text);
    if (records.length === 0) {
      throw new HttpError("No data rows found in CSV", 400);
    }
    if (records.length > 2000) {
      throw new HttpError("CSV exceeds 2000 row limit", 400);
    }

    // Validate headers
    const headers = Object.keys(records[0] ?? {});
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new HttpError(
        `Missing required columns: ${missing.join(", ")}. Required: sku, name`,
        400
      );
    }
    const unknown = headers.filter((h) => !ALLOWED_HEADERS.includes(h));

    // Cache category lookups/creations
    const categoryCache = new Map<string, string>();
    async function resolveCategory(name: string): Promise<string | null> {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const key = trimmed.toLowerCase();
      if (categoryCache.has(key)) return categoryCache.get(key)!;
      let cat = await prisma.category.findFirst({
        where: { name: { equals: trimmed } },
      });
      if (!cat && !dryRun) {
        const baseSlug = slugify(trimmed) || `category-${Date.now().toString(36)}`;
        let slug = baseSlug;
        for (
          let i = 2;
          await prisma.category.findUnique({ where: { slug } });
          i++
        ) {
          slug = `${baseSlug}-${i}`;
        }
        cat = await prisma.category.create({ data: { name: trimmed, slug } });
      }
      const id = cat?.id ?? null;
      if (id) categoryCache.set(key, id);
      return id;
    }

    const results: ImportResult[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let idx = 0; idx < records.length; idx++) {
      const rec = records[idx];
      const rowNum = idx + 2; // +1 header, +1 for 1-indexed
      const sku = (rec.sku ?? "").trim();
      const name = (rec.name ?? "").trim();

      if (!sku || !name) {
        results.push({
          row: rowNum,
          sku,
          status: "skipped",
          error: !sku ? "Missing SKU" : "Missing name",
        });
        skipped++;
        continue;
      }
      if (sku.length > 64) {
        results.push({
          row: rowNum,
          sku,
          status: "skipped",
          error: "SKU exceeds 64 characters",
        });
        skipped++;
        continue;
      }
      if (name.length > 200) {
        results.push({
          row: rowNum,
          sku,
          status: "skipped",
          error: "Name exceeds 200 characters",
        });
        skipped++;
        continue;
      }

      const categoryId = rec.category ? await resolveCategory(rec.category) : null;

      const data = {
        sku,
        name,
        barcode: rec.barcode?.trim() || null,
        description: rec.description?.trim() || null,
        categoryId,
        unit: rec.unit?.trim() || "pcs",
        costPrice: toNumber(rec.costprice),
        sellPrice: toNumber(rec.sellprice),
        reorderPoint: toInt(rec.reorderpoint),
        reorderQty: toInt(rec.reorderqty),
        tags: rec.tags?.trim() || null,
        isActive: true,
      };

      try {
        if (dryRun) {
          const existing = await prisma.product.findUnique({ where: { sku } });
          results.push({
            row: rowNum,
            sku,
            status: existing ? "updated" : "created",
          });
          if (existing) updated++;
          else created++;
          continue;
        }

        const existing = await prisma.product.findUnique({ where: { sku } });
        if (existing) {
          await prisma.product.update({ where: { sku }, data });
          results.push({ row: rowNum, sku, status: "updated" });
          updated++;
        } else {
          await prisma.product.create({ data });
          results.push({ row: rowNum, sku, status: "created" });
          created++;
        }
      } catch (e) {
        results.push({
          row: rowNum,
          sku,
          status: "skipped",
          error: e instanceof Error ? e.message : "Unknown error",
        });
        skipped++;
      }
    }

    if (!dryRun) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "product.imported",
          entity: "product",
          metadata: { created, updated, skipped, total: records.length },
        },
      });
    }

    return ok({
      dryRun,
      total: records.length,
      created,
      updated,
      skipped,
      unknownHeaders: unknown,
      results,
    });
  } catch (err) {
    return handleError(err);
  }
}
