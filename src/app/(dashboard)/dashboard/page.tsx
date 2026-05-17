import Link from "next/link";
import { format, subDays, startOfDay } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { AuditTrendChart } from "@/components/dashboard/audit-trend-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, formatPercent, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  PROCESSING: { label: "AI processing", variant: "warning" },
  REVIEW: { label: "Review", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

async function getDashboardData() {
  const since = startOfDay(subDays(new Date(), 13));

  const [
    totalAudits,
    completedAudits,
    pendingAudits,
    totalProducts,
    totalLocations,
    totalDiscrepancies,
    recentAudits,
    aiInsights,
    auditsSince,
  ] = await Promise.all([
    prisma.audit.count(),
    prisma.audit.count({ where: { status: "COMPLETED" } }),
    prisma.audit.count({ where: { status: { in: ["DRAFT", "IN_PROGRESS", "REVIEW"] } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.location.count({ where: { isActive: true } }),
    prisma.audit.aggregate({ _sum: { discrepancies: true } }),
    prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { location: true, createdBy: true },
    }),
    prisma.aiInsight.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.audit.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, discrepancies: true },
    }),
  ]);

  // build 14 day series
  const series: { date: string; audits: number; discrepancies: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(new Date(), i));
    const next = startOfDay(subDays(new Date(), i - 1));
    const dayAudits = auditsSince.filter(
      (a) => a.createdAt >= day && a.createdAt < next
    );
    series.push({
      date: format(day, "MMM d"),
      audits: dayAudits.length,
      discrepancies: dayAudits.reduce((s, a) => s + a.discrepancies, 0),
    });
  }

  const completionRate =
    totalAudits > 0 ? (completedAudits / totalAudits) * 100 : 0;

  return {
    totalAudits,
    completedAudits,
    pendingAudits,
    totalProducts,
    totalLocations,
    totalDiscrepancies: totalDiscrepancies._sum.discrepancies ?? 0,
    completionRate,
    recentAudits,
    aiInsights,
    series,
  };
}

export default async function DashboardHome() {
  const session = await auth();
  const data = await getDashboardData();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description="Your real-time inventory audit command center."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/reports">View reports</Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link href="/audits/new">
                <Camera className="h-4 w-4" /> Start AI Scan
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Audits"
          value={formatNumber(data.totalAudits)}
          delta={12.4}
          hint="vs last 30d"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KpiCard
          label="Completion Rate"
          value={formatPercent(data.completionRate)}
          delta={3.1}
          hint="of all audits"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <KpiCard
          label="Open Discrepancies"
          value={formatNumber(data.totalDiscrepancies)}
          delta={-8.2}
          hint="across all audits"
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="warning"
        />
        <KpiCard
          label="Products Tracked"
          value={formatNumber(data.totalProducts)}
          hint={`${data.totalLocations} locations`}
          icon={<Package className="h-5 w-5" />}
          accent="primary"
        />
      </div>

      {/* Chart + AI insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Audit activity</CardTitle>
              <CardDescription>Last 14 days · audits started vs discrepancies flagged</CardDescription>
            </div>
            <Badge variant="info">
              <TrendingUp className="h-3 w-3" />
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <AuditTrendChart data={data.series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Insights
            </CardTitle>
            <CardDescription>Anomalies & recommendations from Gemini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aiInsights.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="No insights yet"
                description="Run your first AI audit to start generating insights."
              />
            ) : (
              data.aiInsights.map((ins) => (
                <div
                  key={ins.id}
                  className="rounded-lg border bg-card/50 p-3 transition-colors hover:bg-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        ins.severity === "CRITICAL" || ins.severity === "HIGH"
                          ? "destructive"
                          : ins.severity === "MEDIUM"
                            ? "warning"
                            : "info"
                      }
                    >
                      {ins.severity}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(ins.createdAt)}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-medium">{ins.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {ins.summary}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent audits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent audits</CardTitle>
            <CardDescription>The latest activity across your operation</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/audits">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentAudits.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="No audits yet"
              description="Get started by creating your first AI-powered audit."
              action={
                <Button asChild variant="gradient">
                  <Link href="/audits/new">
                    <Camera className="h-4 w-4" /> Start AI Scan
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y">
              {data.recentAudits.map((a) => {
                const status = STATUS_BADGE[a.status];
                return (
                  <Link
                    key={a.id}
                    href={`/audits/${a.id}`}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-accent/30 -mx-2 px-2 rounded-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ClipboardCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{a.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.location.name} · {a.code} · {timeAgo(a.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="hidden text-right md:block">
                        <div className="text-xs font-medium">{a.totalItems} items</div>
                        <div className="text-[10px] text-muted-foreground">
                          {a.discrepancies} discrepanc{a.discrepancies === 1 ? "y" : "ies"}
                        </div>
                      </div>
                      <Badge variant={status?.variant ?? "secondary"}>
                        {status?.label ?? a.status}
                      </Badge>
                    </div>
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
