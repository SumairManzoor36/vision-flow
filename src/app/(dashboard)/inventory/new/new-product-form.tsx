"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Package, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";

type Category = { id: string; name: string; slug: string };

export function NewProductForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    sku: "",
    name: "",
    description: "",
    barcode: "",
    categoryId: "",
    unit: "EACH",
    costPrice: "",
    sellPrice: "",
    reorderPoint: "0",
    reorderQty: "0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      toast.error("SKU and name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: form.sku.trim(),
          name: form.name.trim(),
          description: form.description || null,
          barcode: form.barcode || null,
          categoryId: form.categoryId || null,
          unit: form.unit,
          costPrice: form.costPrice ? Number(form.costPrice) : null,
          sellPrice: form.sellPrice ? Number(form.sellPrice) : null,
          reorderPoint: Number(form.reorderPoint) || 0,
          reorderQty: Number(form.reorderQty) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success("Product created");
      router.push("/inventory");
      router.refresh();
    } catch (e) {
      toast.error("Could not create product", {
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" /> Back to inventory
          </Link>
        </Button>
        <PageHeader title="Add product" description="Create a new SKU in your catalog" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Product details
              </CardTitle>
              <CardDescription>Required fields are marked with an asterisk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="e.g. BEV-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    placeholder="GTIN / UPC / EAN"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Cola Classic 12oz Can"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Short description, variant info, packaging notes…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of measure</Label>
                  <Select
                    value={form.unit}
                    onValueChange={(v) => setForm({ ...form, unit: v })}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EACH">Each</SelectItem>
                      <SelectItem value="BOX">Box</SelectItem>
                      <SelectItem value="CASE">Case</SelectItem>
                      <SelectItem value="PALLET">Pallet</SelectItem>
                      <SelectItem value="KG">Kilogram</SelectItem>
                      <SelectItem value="LB">Pound</SelectItem>
                      <SelectItem value="LITER">Liter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Sell price</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reordering</CardTitle>
                <CardDescription>Trigger low-stock alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    value={form.reorderPoint}
                    onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderQty">Reorder quantity</Label>
                  <Input
                    id="reorderQty"
                    type="number"
                    min="0"
                    value={form.reorderQty}
                    onChange={(e) => setForm({ ...form, reorderQty: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button asChild variant="outline" type="button">
            <Link href="/inventory">Cancel</Link>
          </Button>
          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Create product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
