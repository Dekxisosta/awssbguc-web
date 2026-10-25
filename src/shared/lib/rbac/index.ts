/**
 * src/shared/lib/rbac/index.ts
 *
 * Server-only RBAC utilities.
 *
 * All permission checks go through the Supabase admin client (service-role key)
 * so they bypass RLS and are never influenced by the caller's session claims.
 *
 * Usage in Route Handlers / Server Components:
 *
 *   const deny = await requirePermission(userId, "events.create");
 *   if (deny) return deny;   // NextResponse with 401/403
 *
 *   // or boolean form:
 *   if (!await can(userId, "events.read")) { ... }
 *
 *   // load all permissions for a user (admin page server component):
 *   const perms = await loadPermissions(userId);
 *   // perms = ["participants.read", "events.read", ...]
 *
 * Never import this file in Client Components or browser bundles.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

// ---------------------------------------------------------------------------
// Permission names — single source of truth
// Must match the seeded permissions.name values in migration 20260009.
// ---------------------------------------------------------------------------

export const PERMISSIONS = {
  PARTICIPANTS_READ:   "participants.read",
  PARTICIPANTS_CREATE: "participants.create",
  PARTICIPANTS_UPDATE: "participants.update",
  PARTICIPANTS_DELETE: "participants.delete",
  EVENTS_READ:         "events.read",
  EVENTS_CREATE:       "events.create",
  EVENTS_UPDATE:       "events.update",
  EVENTS_DELETE:       "events.delete",
  ROLES_READ:          "roles.read",
  ROLES_ASSIGN:        "roles.assign",
  ROLES_MANAGE:        "roles.manage",
  CONTENT_MANAGE:      "content.manage",
  SETTINGS_MANAGE:     "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ---------------------------------------------------------------------------
// Internal: resolve a user's participant_id from auth.users.id
// ---------------------------------------------------------------------------

async function getParticipantId(authUserId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", authUserId)
    .maybeSingle();
  return data?.participant_id ?? null;
}

// ---------------------------------------------------------------------------
// loadPermissions(authUserId)
// Returns the full set of permission names the user holds.
// Single query via join chain: participant_roles → roles → role_permissions → permissions.
// ---------------------------------------------------------------------------

export async function loadPermissions(authUserId: string): Promise<Set<Permission>> {
  const participantId = await getParticipantId(authUserId);
  if (!participantId) return new Set();

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("participant_roles")
    .select(
      `role_id,
       roles!inner (
         role_permissions!inner (
           permissions!inner ( name )
         )
       )`
    )
    .eq("participant_id", participantId)
    .not("role_id", "is", null);

  if (error) {
    console.error("[loadPermissions] query error:", error.message);
    return new Set();
  }

  const names = new Set<Permission>();
  for (const pr of data ?? []) {
    const role = (pr as unknown as { roles: { role_permissions: { permissions: { name: string } }[] } }).roles;
    for (const rp of role?.role_permissions ?? []) {
      names.add(rp.permissions.name as Permission);
    }
  }

  return names;
}

// ---------------------------------------------------------------------------
// can(authUserId, permission)
// Boolean permission check. Loads all permissions for the user and checks
// membership in the set. For routes that check a single permission on one request.
// ---------------------------------------------------------------------------

export async function can(authUserId: string, permission: Permission): Promise<boolean> {
  const perms = await loadPermissions(authUserId);
  return perms.has(permission);
}

// ---------------------------------------------------------------------------
// requirePermission(authUserId, permission)
// Returns a NextResponse error if the user is not authenticated or lacks the
// permission. Returns null if the check passes.
//
// Pattern:
//   const deny = await requirePermission(userId, PERMISSIONS.EVENTS_CREATE);
//   if (deny) return deny;
// ---------------------------------------------------------------------------

export async function requirePermission(
  authUserId: string | null | undefined,
  permission: Permission
): Promise<NextResponse | null> {
  if (!authUserId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const allowed = await can(authUserId, permission);
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden. You do not have the required permission.", permission },
      { status: 403 }
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// requireAnyPermission(authUserId, ...permissions)
// Passes if the user holds at least one of the listed permissions.
// ---------------------------------------------------------------------------

export async function requireAnyPermission(
  authUserId: string | null | undefined,
  ...perms: Permission[]
): Promise<NextResponse | null> {
  if (!authUserId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const userPerms = await loadPermissions(authUserId);
  const allowed = perms.some((p) => userPerms.has(p));
  if (!allowed) {
    return NextResponse.json(
      { error: "Forbidden. You do not have the required permission.", required: perms },
      { status: 403 }
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// permissionsToArray(set)
// Converts a Set<Permission> to a plain sorted string array for serialising
// into server component props / client-side rendering decisions.
// ---------------------------------------------------------------------------

export function permissionsToArray(perms: Set<Permission>): Permission[] {
  return Array.from(perms).sort();
}

// ---------------------------------------------------------------------------
// Privilege escalation guard
// Returns true if the granter's permission set is a superset of the role's
// permission set. Prevents granting roles whose capabilities exceed the caller's.
// ---------------------------------------------------------------------------

export async function callerCanGrantRole(
  authUserId: string,
  targetRoleId: string
): Promise<boolean> {
  const callerPerms = await loadPermissions(authUserId);
  if (callerPerms.size === 0) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("role_permissions")
    .select("permissions!inner ( name )")
    .eq("role_id", targetRoleId);

  const rolePerms = (data ?? []).map(
    (r) => (r as unknown as { permissions: { name: string } }).permissions.name as Permission
  );

  // Caller must hold every permission that the target role holds.
  return rolePerms.every((p) => callerPerms.has(p));
}
