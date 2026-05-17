import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { hasMinRole } from "@/lib/rbac";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await auth();
  if (!hasMinRole(session?.user.role, "MANAGER")) redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" description="System-wide audit trail" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" /> {logs.length} events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          ) : (
            <ul className="divide-y">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{l.action}</Badge>
                      {l.entity && (
                        <span className="text-xs text-muted-foreground">
                          {l.entity}
                          {l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      by {l.user?.name || l.user?.email || "system"}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(l.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
