import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

export const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  AUDITOR: 2,
  MANAGER: 3,
  ADMIN: 4,
};

export function hasMinRole(userRole: Role | undefined, min: Role) {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[min];
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(min: Role) {
  const session = await requireAuth();
  if (!hasMinRole(session.user.role, min)) throw new Error("FORBIDDEN");
  return session;
}

export const PERMISSIONS = {
  AUDIT_CREATE: ["ADMIN", "MANAGER", "AUDITOR"] as Role[],
  AUDIT_REVIEW: ["ADMIN", "MANAGER"] as Role[],
  INVENTORY_EDIT: ["ADMIN", "MANAGER"] as Role[],
  USERS_MANAGE: ["ADMIN"] as Role[],
  SETTINGS_MANAGE: ["ADMIN"] as Role[],
  REPORTS_VIEW: ["ADMIN", "MANAGER", "AUDITOR", "VIEWER"] as Role[],
};

export function canDo(role: Role | undefined, perm: keyof typeof PERMISSIONS) {
  if (!role) return false;
  return PERMISSIONS[perm].includes(role);
}
