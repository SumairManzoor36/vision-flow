import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_DOT: Record<string, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  alert: "bg-destructive",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `You have ${unread} unread notification${unread === 1 ? "" : "s"}`
            : "All caught up — no unread notifications."
        }
        actions={
          unread > 0 ? (
            <Badge variant="warning" className="text-xs">
              {unread} unread
            </Badge>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Status updates from audits you’re involved in.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title="No notifications yet"
                description="Once audits are reviewed or completed, you’ll see updates here."
              />
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const body = (
                  <div className="flex gap-3 p-4 transition-colors hover:bg-accent">
                    <span
                      className={cn(
                        "mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                        TYPE_DOT[n.type] ?? "bg-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{n.title}</p>
                        {!n.read && (
                          <Badge variant="info" className="text-[10px]">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground/70">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className={cn(!n.read && "bg-primary/[0.03]")}>
                    {n.link ? <Link href={n.link}>{body}</Link> : body}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
