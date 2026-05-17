import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleError, ok, requireRoleSession, requireSession } from "@/lib/api";
import { notify, notifyMany } from "@/lib/notify";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  status: z
    .enum(["DRAFT", "IN_PROGRESS", "PROCESSING", "REVIEW", "COMPLETED", "CANCELLED"])
    .optional(),
  notes: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        location: true,
        createdBy: { select: { id: true, name: true, email: true, image: true } },
        assignedTo: { select: { id: true, name: true, email: true, image: true } },
        scans: { orderBy: { capturedAt: "desc" } },
        items: {
          include: { product: true },
          orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!audit) return ok({ error: "Not found" }, { status: 404 });
    return ok({ audit });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleSession("AUDITOR");
    const { id } = await params;
    const data = updateSchema.parse(await req.json());

    const before = await prisma.audit.findUnique({
      where: { id },
      select: { status: true, createdById: true, assignedToId: true },
    });

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
        ...(data.status === "IN_PROGRESS" && { startedAt: new Date() }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "audit.updated",
        entity: "audit",
        entityId: id,
        metadata: data,
      },
    });

    // Fire notifications on status transitions (non-blocking, best-effort)
    if (before && data.status && data.status !== before.status) {
      const auditLink = `/audits/${id}`;
      if (data.status === "REVIEW") {
        // Notify managers/admins so someone can review
        const reviewers = await prisma.user.findMany({
          where: { role: { in: ["MANAGER", "ADMIN"] }, isActive: true },
          select: { id: true },
        });
        await notifyMany(
          reviewers.map((r) => r.id),
          {
            title: "Audit ready for review",
            message: `${audit.title} (${audit.code}) is awaiting review.`,
            type: "warning",
            link: auditLink,
          }
        );
      } else if (data.status === "COMPLETED") {
        // Notify the creator and assignee
        const recipients = new Set<string>();
        if (before.createdById) recipients.add(before.createdById);
        if (before.assignedToId) recipients.add(before.assignedToId);
        recipients.delete(session.user.id);
        await notifyMany([...recipients], {
          title: "Audit completed",
          message: `${audit.title} was completed with ${audit.discrepancies} discrepancies.`,
          type: audit.discrepancies > 0 ? "warning" : "success",
          link: auditLink,
        });
      } else if (
        data.status === "IN_PROGRESS" &&
        before.assignedToId &&
        before.assignedToId !== session.user.id
      ) {
        await notify({
          userId: before.assignedToId,
          title: "Audit started",
          message: `${audit.title} (${audit.code}) is now in progress.`,
          type: "info",
          link: auditLink,
        });
      }
    }

    return ok({ audit });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRoleSession("MANAGER");
    const { id } = await params;
    await prisma.audit.delete({ where: { id } });
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "audit.deleted",
        entity: "audit",
        entityId: id,
      },
    });
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
