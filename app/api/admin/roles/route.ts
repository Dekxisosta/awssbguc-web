import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["admin", "officer", "member"] as const;
type Role = (typeof VALID_ROLES)[number];

async function getCallerParticipantId(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.participant_id ?? null;
}

async function isAdmin(userId: string): Promise<boolean> {
  const participantId = await getCallerParticipantId(userId);
  if (!participantId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", participantId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

/** POST — grant a role to a participant */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerId = await getCallerParticipantId(user.id);
  if (!callerId || !await isAdmin(user.id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { participant_id, role } = (body ?? {}) as { participant_id?: string; role?: string };
  if (!participant_id) return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role as Role))
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("participant_roles").upsert(
    { participant_id, role, granted_by: callerId },
    { onConflict: "participant_id,role" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

/** DELETE — revoke a role from a participant */
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { participant_id, role } = (body ?? {}) as { participant_id?: string; role?: string };
  if (!participant_id) return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role as Role))
    return NextResponse.json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` }, { status: 400 });

  // Prevent an admin from revoking their own admin role
  const callerId = await getCallerParticipantId(user.id);
  if (callerId === participant_id && role === "admin")
    return NextResponse.json({ error: "You cannot revoke your own admin role." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("participant_roles")
    .delete()
    .eq("participant_id", participant_id)
    .eq("role", role);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
