import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import type { PublicMemberProfile } from "@/src/entities/member";

/**
 * GET /api/members?page=1
 *
 * Returns a paginated list (20 per page) of opted-in public member profiles,
 * sourced from the `public_member_profiles` view (migration 20260006).
 *
 * Only accounts that have set directory_visible = true AND have at least one
 * social link are returned. The view enforces both conditions.
 *
 * Sensitive fields intentionally excluded by the view:
 *   - supplied_name, email (personal identity / contact data)
 *   - qr_token, user_id, profile_id (security / internal keys)
 *   - student_number, date_of_birth, contact_number (institutional PII)
 *   - initial_setup_completed, directory_visible (internal flags)
 *
 * Response shape:
 *   { members: PublicMemberProfile[], page, totalPages, totalCount }
 */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = req.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Total count via dedicated function — no row data exposed.
    const { data: countRow, error: countError } = await admin.rpc("count_public_members");
    if (countError) {
      console.error("[GET /api/members] count error:", countError.message);
      return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
    }

    const totalCount = Number(countRow ?? 0);
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

    if (totalCount === 0) {
      return NextResponse.json({ members: [], page, totalPages, totalCount: 0 });
    }

    // Page of rows from the public view.
    const { data: rows, error } = await admin
      .from("public_member_profiles")
      .select("member_id, display_name, username, avatar_url, github_username, bio, skills")
      .range(from, to);

    if (error) {
      console.error("[GET /api/members] view query error:", error.message);
      return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
    }

    const members: PublicMemberProfile[] = (rows ?? []).map((r) => ({
      member_id:       r.member_id       as string,
      display_name:    r.display_name    as string | null,
      username:        r.username        as string | null,
      avatar_url:      r.avatar_url      as string | null,
      github_username: r.github_username as string | null,
      bio:             r.bio             as string | null,
      skills:          r.skills          as string[] | null,
    }));

    return NextResponse.json({ members, page, totalPages, totalCount });
  } catch (err) {
    console.error("[GET /api/members] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
