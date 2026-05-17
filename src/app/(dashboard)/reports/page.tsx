import { format, startOfDay, subDays } from "date-fns";
import { TrendingUp, AlertTriangle, CheckCircle2, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AuditTrendChart } from "@/components/dashboard/audit-trend-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const since = startOfDay(subDays(new Date(), 29));

  const [audits, totalDiscrepancies, totalAudits, byLocation] = await Promise.all([
    prisma.audit.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, discrepancies: true, totalItems: true, status: true },
    }),
    prisma.audit.aggregate({ _sum: { discrepancies: true } }),
    prisma.audit.count(),
    prisma.audit.groupBy({
      by: ["locationId"],
      _count: { _all: true },
      _sum: { discrepancies: true, totalItems: true },
    }),
  ]);

  const series: { date: string; audits: number; discrepancies: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const next = startOfDay(subDays(new Date(), i - 1));
    const dayAudits = audits.filter((a) => a.createdAt >= day && a.createdAt < next);
    series.push({
      date: format(day, "MMM d"),
      audits: dayAudits.length,
      discrepancies: dayAudits.reduce((s, a) => s + a.discrepancies, 0),
    });
  }

  const completed = audits.filter((a) => a.status === "COMPLETED").length;
  const completionRate = audits.length > 0 ? (completed / audits.length) * 100 : 0;
  const totalCounted = audits.reduce((s, a) => s + a.totalItems, 0);
  const accuracyRate =
    totalCounted > 0
      ? Math.max(
          0,
          ((totalCounted - audits.reduce((s, a) => s + a.discrepancies, 0)) /
            totalCounted) *
            100
        )
      : 100;

  const locations = await prisma.location.findMany({
    where: { id: { in: byLocation.map((b) => b.locationId) } },
    select: { id: true, name: true, code: true },
  });
  const locMap = new Map(locations.map((l) => [l.id, l]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational analytics across your inventory operations"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Audits (30d)"
          value={formatNumber(audits.length)}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <KpiCard
          label="Completion rate"
          value={formatPercent(completionRate)}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <KpiCard
          label="Items audited"
          value={formatNumber(totalCounted)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          label="Accuracy"
          value={formatPercent(accuracyRate)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={accuracyRate > 95 ? "success" : "warning"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>30-day audit trend</CardTitle>
          <CardDescription>Daily audit volume vs discrepancies flagged</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTrendChart data={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By location</CardTitle>
          <CardDescription>Total audits and discrepancies per location</CardDescription>
        </CardHeader>
        <CardContent>
          {byLocation.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No location data yet.
            </p>
          ) : (
            <div className="space-y-3">
              {byLocation.map((b) => {
                const loc = locMap.get(b.locationId);
                const items = b._sum.totalItems ?? 0;
                const disc = b._sum.discrepancies ?? 0;
                const rate = items > 0 ? Math.max(0, ((items - disc) / items) * 100) : 100;
                return (
                  <div
                    key={b.locationId}
                    className="flex items-center justify-between rounded-lg border bg-card/50 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {loc?.name ?? "Unknown"}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          {loc?.code}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {b._count._all} audits · {formatNumber(items)} items · {disc} discrepancies
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold">{formatPercent(rate)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Accuracy
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Total lifetime audits: {formatNumber(totalAudits)} · Total lifetime discrepancies:{" "}
        {formatNumber(totalDiscrepancies._sum.discrepancies ?? 0)}
      </p>
    </div>
  );
}
