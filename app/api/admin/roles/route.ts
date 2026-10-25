import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import {
  requirePermission,
  callerCanGrantRole,
  loadPermissions,
  PERMISSIONS,
} from "@/src/shared/lib/rbac";

export const dynamic = "force-dynamic";

// Built-in role UUIDs seeded in migration 20260009.
// These are fixed and must not be deleted by the API.
const SYSTEM_ROLE_NAMES = ["super_admin", "admin", "moderator"] as const;

async function getCallerParticipantId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.participant_id ?? null;
}

async function getRoleById(roleId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("roles")
    .select("id, name, is_system")
    .eq("id", roleId)
    .maybeSingle();
  return data;
}

async function getRoleByName(name: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("roles")
    .select("id, name, is_system")
    .eq("name", name)
    .maybeSingle();
  return data;
}

// ─── GET — list all roles with their permissions ──────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.ROLES_READ);
  if (deny) return deny;

  const admin = createAdminClient();
  const { data: roles, error } = await admin
    .from("roles")
    .select(`
      id, name, description, is_system,
      role_permissions (
        permissions ( id, name, resource, action )
      )
    `)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles: roles ?? [] });
}

// ─── POST — grant a role to a participant ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.ROLES_ASSIGN);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, role_name } =
    (body ?? {}) as { participant_id?: string; role_name?: string };

  if (!participant_id) return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  if (!role_name)      return NextResponse.json({ error: "role_name required" }, { status: 400 });

  const targetRole = await getRoleByName(role_name);
  if (!targetRole) return NextResponse.json({ error: `Role "${role_name}" not found.` }, { status: 404 });

  // Privilege escalation guard: caller must hold all permissions of the target role.
  if (user?.id && !await callerCanGrantRole(user.id, targetRole.id)) {
    return NextResponse.json(
      { error: "You cannot grant a role whose permissions exceed your own." },
      { status: 403 }
    );
  }

  const callerId = user?.id ? await getCallerParticipantId(user.id) : null;
  const admin = createAdminClient();

  const { error } = await admin.from("participant_roles").upsert(
    {
      participant_id,
      role:       role_name,       // keep TEXT column in sync for backward compat
      role_id:    targetRole.id,
      granted_by: callerId,
    },
    { onConflict: "participant_id,role" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ─── DELETE — revoke a role from a participant ────────────────────────────────

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.ROLES_ASSIGN);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, role_name } =
    (body ?? {}) as { participant_id?: string; role_name?: string };

  if (!participant_id) return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  if (!role_name)      return NextResponse.json({ error: "role_name required" }, { status: 400 });

  const callerId = user?.id ? await getCallerParticipantId(user.id) : null;

  // Self-demotion guard: cannot revoke your own highest privilege role if it
  // would leave you with fewer permissions than needed to manage roles.
  if (callerId === participant_id) {
    const callerPerms = await loadPermissions(user!.id);
    if (!callerPerms.has(PERMISSIONS.ROLES_ASSIGN)) {
      return NextResponse.json(
        { error: "You cannot revoke your own role assignment privilege." },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("participant_roles")
    .delete()
    .eq("participant_id", participant_id)
    .eq("role", role_name);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ─── PUT — manage role definitions (roles.manage required) ───────────────────

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.ROLES_MANAGE);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, role_id, name, description, permission_names } =
    (body ?? {}) as {
      action?: string;
      role_id?: string;
      name?: string;
      description?: string;
      permission_names?: string[];
    };

  const admin = createAdminClient();

  if (action === "create") {
    if (!name?.trim())
      return NextResponse.json({ error: "name required" }, { status: 400 });

    const { data: newRole, error: createErr } = await admin
      .from("roles")
      .insert({ name: name.trim(), description: description?.trim() ?? null, is_system: false })
      .select("id, name")
      .single();

    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });

    // Assign permissions if provided
    if (permission_names && permission_names.length > 0) {
      const { data: perms } = await admin
        .from("permissions")
        .select("id")
        .in("name", permission_names);

      if (perms && perms.length > 0) {
        await admin.from("role_permissions").insert(
          perms.map((p) => ({ role_id: newRole.id, permission_id: p.id }))
        );
      }
    }

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  }

  if (action === "delete") {
    if (!role_id) return NextResponse.json({ error: "role_id required" }, { status: 400 });

    const existing = await getRoleById(role_id);
    if (!existing) return NextResponse.json({ error: "Role not found." }, { status: 404 });
    if (existing.is_system)
      return NextResponse.json({ error: "System roles cannot be deleted." }, { status: 400 });

    const { error } = await admin.from("roles").delete().eq("id", role_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "set_permissions") {
    if (!role_id)
      return NextResponse.json({ error: "role_id required" }, { status: 400 });
    if (!Array.isArray(permission_names))
      return NextResponse.json({ error: "permission_names must be an array" }, { status: 400 });

    const existing = await getRoleById(role_id);
    if (!existing) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    // Replace all permissions on this role
    await admin.from("role_permissions").delete().eq("role_id", role_id);

    if (permission_names.length > 0) {
      const { data: perms } = await admin
        .from("permissions")
        .select("id")
        .in("name", permission_names);

      if (perms && perms.length > 0) {
        await admin.from("role_permissions").insert(
          perms.map((p) => ({ role_id, permission_id: p.id }))
        );
      }
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "action must be one of: create, delete, set_permissions" },
    { status: 400 }
  );
}
