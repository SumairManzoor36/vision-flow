import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateInsightsButton } from "./generate-button";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SEVERITY_VARIANT: Record<string, BadgeProps["variant"]> = {
  INFO: "info",
  LOW: "secondary",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

export default async function InsightsPage() {
  const insights = await prisma.aiInsight.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Operational anomalies, recommendations and forecasts powered by Gemini"
        actions={<GenerateInsightsButton />}
      />

      {insights.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="No insights yet"
              description="Click 'Generate insights' to have Gemini analyze your operations."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((ins) => (
            <Card key={ins.id} className="relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <Badge variant={SEVERITY_VARIANT[ins.severity] ?? "info"}>
                    {ins.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(ins.createdAt)}
                  </span>
                </div>
                <CardTitle className="mt-2 text-base">{ins.title}</CardTitle>
                <CardDescription>{ins.category}</CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-2">
                <p className="text-sm">{ins.summary}</p>
                {ins.details && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Details
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap">{ins.details}</p>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
