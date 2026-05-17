import Link from "next/link";
import { Package, Plus, AlertTriangle, Upload } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { InventoryFilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; low?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categoryId = sp.category ?? "";
  const lowOnly = sp.low === "1";

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { barcode: { contains: q } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const [allProducts, categories, locationCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        stockItems: { include: { location: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.location.count({ where: { isActive: true } }),
  ]);

  const products = lowOnly
    ? allProducts.filter((p) => {
        const onHand = p.stockItems.reduce((s, x) => s + x.quantity, 0);
        return p.reorderPoint > 0 && onHand <= p.reorderPoint;
      })
    : allProducts;

  const hasFilter = Boolean(q || categoryId || lowOnly);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${formatNumber(products.length)} products across ${locationCount} locations`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/inventory/import">
                <Upload className="h-4 w-4" /> Import CSV
              </Link>
            </Button>
            <Button asChild variant="gradient">
              <Link href="/inventory/new">
                <Plus className="h-4 w-4" /> Add product
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All products</CardTitle>
          <CardDescription>
            Click a row to view stock levels per location.
          </CardDescription>
        </CardHeader>
        <InventoryFilterBar
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          initialQuery={q}
          initialCategory={categoryId}
          initialLow={lowOnly}
        />
        <CardContent className="p-0">
          {products.length === 0 ? (
            hasFilter ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium">No products match your filters.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try clearing search terms or selecting a different category.
                </p>
              </div>
            ) : (
            <div className="p-6">
              <EmptyState
                icon={<Package className="h-5 w-5" />}
                title="No products yet"
                description="Add products to your catalog to start tracking inventory."
                action={
                  <Button asChild variant="gradient">
                    <Link href="/inventory/new">
                      <Plus className="h-4 w-4" /> Add product
                    </Link>
                  </Button>
                }
              />
            </div>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const onHand = p.stockItems.reduce((s, x) => s + x.quantity, 0);
                  const lowStock = onHand <= p.reorderPoint && p.reorderPoint > 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.description && (
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-mono">{p.sku}</div>
                        {p.barcode && (
                          <div className="font-mono text-muted-foreground">{p.barcode}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.category ? (
                          <Badge variant="secondary">{p.category.name}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatNumber(onHand)}</div>
                        {lowStock && (
                          <Badge variant="warning" className="mt-1">
                            <AlertTriangle className="h-3 w-3" /> Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {p.reorderPoint}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(p.costPrice ? Number(p.costPrice) : null)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
