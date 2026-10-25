import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, requireAnyPermission, PERMISSIONS } from "@/src/shared/lib/rbac";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.PARTICIPANTS_READ);
  if (deny) return deny;

  const { searchParams } = req.nextUrl;
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("q")?.trim() ?? "";

  const admin = createAdminClient();
  const from  = (page - 1) * PAGE_SIZE;
  const to    = from + PAGE_SIZE - 1;

  let query = admin
    .from("participants")
    .select(
      `participant_id, display_name, supplied_name, email, status, member_roster_id, user_id,
       participant_roles!participant_roles_participant_fk ( role, granted_at ),
       profiles!profiles_profile_id_fkey ( username, avatar_url, initial_setup_completed )`,
      { count: "exact" }
    )
    .order("display_name", { ascending: true })
    .range(from, to);

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%,supplied_name.ilike.%${search}%,email.ilike.%${search}%,member_roster_id.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[GET /api/admin/members]", error.message);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }

  return NextResponse.json({
    members:    data ?? [],
    total:      count ?? 0,
    page,
    totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
  });
}

/** PATCH — update a participant's status (active/inactive) */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.PARTICIPANTS_UPDATE);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { participant_id, status } = (body ?? {}) as { participant_id?: string; status?: string };
  if (!participant_id) return NextResponse.json({ error: "participant_id required" }, { status: 400 });
  if (!status || !["active", "inactive"].includes(status))
    return NextResponse.json({ error: "status must be 'active' or 'inactive'" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("participants")
    .update({ status })
    .eq("participant_id", participant_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
