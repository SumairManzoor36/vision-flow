import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { hasMinRole } from "@/lib/rbac";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new HttpError("Unauthorized", 401);
  return session;
}

export async function requireRoleSession(min: Role) {
  const session = await requireSession();
  if (!hasMinRole(session.user.role, min)) {
    throw new HttpError("Forbidden", 403);
  }
  return session;
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 }
    );
  }
  console.error("[api]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
