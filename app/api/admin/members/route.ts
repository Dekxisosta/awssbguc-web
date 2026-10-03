import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

export const dynamic = "force-dynamic";

async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const { data: role } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", data.participant_id)
    .eq("role", "admin")
    .maybeSingle();
  return !!role;
}

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
       participant_roles ( role, granted_at ),
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
    members: data ?? [],
    total: count ?? 0,
    page,
    totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
  });
}
