import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import type { PublicMemberProfile } from "@/src/entities/member";

/**
 * GET /api/members?page=1
 *
 * Returns a paginated list (20 per page) of public-safe participant profiles.
 * Any active participant qualifies — no SBG membership or account required.
 *
 * Sensitive fields intentionally excluded from SELECT:
 *   - participant_id used only as a key fallback; not exposed in response IDs
 *   - supplied_name, email (personal identity / contact data)
 *   - qr_token, user_id (security / internal keys)
 *   - student_number, date_of_birth, contact_number (institutional PII)
 *   - initial_setup_completed (internal account state)
 *   - profile_id (= user_id UUID; internal)
 *
 * Response shape:
 *   { members: PublicMemberProfile[], page: number, totalPages: number, totalCount: number }
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

    // Fetch one page of active participants, sorted alphabetically by display_name.
    const { data: participants, error: participantsError, count } = await admin
      .from("participants")
      .select("participant_id, user_id, member_roster_id, display_name", { count: "exact" })
      .eq("status", "active")
      .order("display_name", { ascending: true })
      .range(from, to);

    if (participantsError) {
      console.error("[GET /api/members] participants query error:", participantsError);
      return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
    }

    const list = participants ?? [];
    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    if (list.length === 0) {
      return NextResponse.json({ members: [], page, totalPages, totalCount: count ?? 0 });
    }

    // Only participants with a linked account have a profile row.
    const userIds = list
      .map((p) => p.user_id as string | null)
      .filter((id): id is string => id !== null);

    const profileMap = new Map<string, {
      username: string | null;
      avatar_url: string | null;
      github_username: string | null;
      discord_id: string | null;
    }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await admin
        .from("profiles")
        .select("profile_id, username, avatar_url, github_username, discord_id")
        .in("profile_id", userIds);

      if (profilesError) {
        console.error("[GET /api/members] profiles query error:", profilesError);
        return NextResponse.json({ error: "Failed to load member profiles" }, { status: 500 });
      }

      for (const p of profiles ?? []) {
        profileMap.set(p.profile_id, p);
      }
    }

    const members: PublicMemberProfile[] = list.map((participant) => {
      const profile = participant.user_id
        ? profileMap.get(participant.user_id as string)
        : undefined;
      return {
        member_id: participant.member_roster_id ?? participant.participant_id,
        display_name: participant.display_name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
        github_username: profile?.github_username ?? null,
        discord_id: profile?.discord_id ?? null,
      };
    });

    return NextResponse.json({ members, page, totalPages, totalCount: count ?? 0 });
  } catch (err) {
    console.error("[GET /api/members] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
