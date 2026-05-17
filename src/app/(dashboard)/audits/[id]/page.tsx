import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { hasMinRole } from "@/lib/rbac";
import { AuditStatusActions } from "./audit-status-actions";
import { AuditItemsTable } from "./items-table";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  IN_PROGRESS: { label: "In progress", variant: "info" },
  PROCESSING: { label: "AI processing", variant: "warning" },
  REVIEW: { label: "Review", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      location: true,
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      scans: { orderBy: { capturedAt: "desc" } },
      items: { include: { product: true }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!audit) notFound();

  const session = await auth();
  const canEdit = hasMinRole(session?.user?.role, "AUDITOR");

  const status = STATUS_BADGE[audit.status];
  const matchRate =
    audit.totalItems > 0
      ? Math.round((audit.matchedItems / Math.max(audit.totalItems, 1)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/audits">
            <ArrowLeft className="h-4 w-4" /> All audits
          </Link>
        </Button>
        <PageHeader
          title={audit.title}
          description={
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="font-mono">{audit.code}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {audit.location.name}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {audit.createdBy.name || audit.createdBy.email}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {formatDate(audit.createdAt)}
              </span>
            </span>
          }
          actions={
            <>
              <Badge variant={status?.variant ?? "secondary"}>{status?.label ?? audit.status}</Badge>
              <AuditStatusActions auditId={audit.id} status={audit.status} />
            </>
          }
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatBox
          label="Items detected"
          value={formatNumber(audit.totalItems)}
          icon={<ImageIcon className="h-4 w-4" />}
        />
        <StatBox
          label="Matched"
          value={formatNumber(audit.matchedItems)}
          accent="success"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatBox
          label="Discrepancies"
          value={formatNumber(audit.discrepancies)}
          accent={audit.discrepancies > 0 ? "warning" : "success"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatBox
          label="Match rate"
          value={`${matchRate}%`}
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
      </div>

      {/* AI Summary */}
      {audit.aiSummary && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex gap-3 p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                AI summary{" "}
                {audit.aiConfidence !== null && (
                  <span className="text-muted-foreground">
                    · {Math.round((audit.aiConfidence ?? 0) * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm">{audit.aiSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Scans</CardTitle>
            <CardDescription>Photos analyzed by Gemini Vision</CardDescription>
          </div>
          <Button asChild variant="gradient" size="sm">
            <Link href={`/audits/new?continue=${audit.id}`}>
              <Camera className="h-4 w-4" /> Add scan
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {audit.scans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No scans yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {audit.scans.map((s) => (
                <div key={s.id} className="overflow-hidden rounded-lg border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.imageUrl}
                    alt="Audit scan"
                    className="aspect-video w-full object-cover"
                  />
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {timeAgo(s.capturedAt)}
                      </span>
                      {s.aiLatencyMs && (
                        <span className="text-muted-foreground">
                          {(s.aiLatencyMs / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                    {s.aiModel && (
                      <Badge variant="info" className="mt-2 text-[10px]">
                        {s.aiModel}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Detected items ({audit.items.length})</CardTitle>
          <CardDescription>
            Reconciliation results — review, adjust quantities, and resolve discrepancies.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <AuditItemsTable
            canEdit={canEdit}
            items={audit.items.map((it) => ({
              id: it.id,
              detectedLabel: it.detectedLabel,
              detectedQty: it.detectedQty,
              expectedQty: it.expectedQty,
              confidence: it.confidence,
              status: it.status,
              productId: it.productId,
              notes: it.notes,
              product: it.product
                ? { id: it.product.id, name: it.product.name, sku: it.product.sku }
                : null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: "primary" | "success" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span
            className={
              accent === "success"
                ? "text-success"
                : accent === "warning"
                  ? "text-warning"
                  : "text-primary"
            }
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </Card>
  );
}
