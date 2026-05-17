"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    code: "",
    type: "WAREHOUSE",
    address: "",
    city: "",
    country: "",
    manager: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          type: form.type,
          address: form.address || null,
          city: form.city || null,
          country: form.country || null,
          manager: form.manager || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      toast.success("Location created");
      router.push("/locations");
      router.refresh();
    } catch (e) {
      toast.error("Could not create location", {
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
          <Link href="/locations">
            <ArrowLeft className="h-4 w-4" /> Back to locations
          </Link>
        </Button>
        <PageHeader
          title="Add location"
          description="Create a new warehouse, store, or stockroom"
        />
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Location details
            </CardTitle>
            <CardDescription>
              Code must be unique — used as a short reference in audits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. New York Distribution Center"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="WH-NYC-01"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                  <SelectItem value="STORE">Store</SelectItem>
                  <SelectItem value="STOCKROOM">Stockroom</SelectItem>
                  <SelectItem value="TRANSIT">Transit / In-route</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Manager (optional)</Label>
              <Input
                id="manager"
                placeholder="Name of the responsible person"
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex max-w-2xl items-center justify-end gap-3">
          <Button asChild variant="outline" type="button">
            <Link href="/locations">Cancel</Link>
          </Button>
          <Button type="submit" variant="gradient" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Create location
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
