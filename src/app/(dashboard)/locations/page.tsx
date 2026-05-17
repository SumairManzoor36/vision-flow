import Link from "next/link";
import { MapPin, Plus, Warehouse, Store, Boxes, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  WAREHOUSE: Warehouse,
  STORE: Store,
  STOCKROOM: Boxes,
  TRANSIT: Truck,
  OTHER: MapPin,
};

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { stockItems: true, audits: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Warehouses, stores, and stockrooms across your operation"
        actions={
          <Button asChild variant="gradient">
            <Link href="/locations/new">
              <Plus className="h-4 w-4" /> Add location
            </Link>
          </Button>
        }
      />

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<MapPin className="h-5 w-5" />}
              title="No locations yet"
              description="Add a warehouse or store to start auditing inventory."
              action={
                <Button asChild variant="gradient">
                  <Link href="/locations/new">
                    <Plus className="h-4 w-4" /> Add location
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((l) => {
            const Icon = TYPE_ICON[l.type] ?? MapPin;
            return (
              <Card key={l.id} className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-brand-500 to-purple-600" />
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{l.name}</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{l.code}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="info">{l.type}</Badge>
                </CardHeader>
                <CardContent>
                  {l.address && (
                    <p className="text-sm text-muted-foreground">
                      {l.address}
                      {l.city && `, ${l.city}`}
                      {l.country && `, ${l.country}`}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{l._count.stockItems}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Stock items
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{l._count.audits}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Audits
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
