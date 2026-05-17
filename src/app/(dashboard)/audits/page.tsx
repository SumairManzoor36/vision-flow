import Link from "next/link";
import { Camera, ClipboardCheck, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  PROCESSING: { label: "AI processing", variant: "warning" },
  REVIEW: { label: "Review", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default async function AuditsPage() {
  const audits = await prisma.audit.findMany({
    include: {
      location: true,
      createdBy: { select: { name: true, email: true } },
      _count: { select: { items: true, scans: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audits"
        description="All inventory audits across your operation"
        actions={
          <Button asChild variant="gradient">
            <Link href="/audits/new">
              <Camera className="h-4 w-4" /> New AI Scan
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{formatNumber(audits.length)} audits</CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="No audits yet"
              description="Run your first AI-powered inventory scan to see results here."
              action={
                <Button asChild variant="gradient">
                  <Link href="/audits/new">
                    <Plus className="h-4 w-4" /> Create audit
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {audits.map((a) => {
                const status = STATUS_BADGE[a.status];
                const matchRate =
                  a.totalItems > 0
                    ? Math.round((a.matchedItems / Math.max(a.totalItems, 1)) * 100)
                    : 0;
                return (
                  <Link
                    key={a.id}
                    href={`/audits/${a.id}`}
                    className="group flex flex-col gap-3 rounded-lg border bg-card/40 p-4 transition-all hover:bg-card hover:shadow-elevated md:flex-row md:items-center md:gap-6"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{a.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {a.code}
                          </span>
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.location.name} · {a.method.replace("_", " ")} ·{" "}
                          {formatDate(a.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center md:gap-8">
                      <div>
                        <div className="text-base font-semibold">{a.totalItems}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Items
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-semibold">{a.discrepancies}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Discrep.
                        </div>
                      </div>
                      <div>
                        <div className="text-base font-semibold">{matchRate}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Match
                        </div>
                      </div>
                    </div>

                    <Badge variant={status?.variant ?? "secondary"} className="md:w-28 justify-center">
                      {status?.label ?? a.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
