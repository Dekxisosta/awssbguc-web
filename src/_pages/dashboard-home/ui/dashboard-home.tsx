import { createAdminClient } from "@/src/shared/supabase/admin";
import { HomeClient } from "@/src/widgets/home-client";
import type { PublicMemberProfile } from "@/src/entities/member";

export const dashboardHomeMetadata = { title: "Home — AWSSBG-UC" };

/** How many member cards the home page shows. */
const MEMBERS_SHOWN = 8;

/**
 * Members who opted into the public directory (same `public_member_profiles` view the
 * /members page uses, so only public-safe fields are ever read). A random window of the
 * list is shown so the same people aren't always first. Failures degrade to an empty list.
 */
async function loadPublicMembers(
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ members: PublicMemberProfile[]; memberCount: number }> {
  const { data: countRow } = await supabase.rpc("count_public_members");
  const memberCount = Number(countRow ?? 0);
  if (memberCount === 0) return { members: [], memberCount: 0 };

  const start = Math.floor(Math.random() * Math.max(1, memberCount - MEMBERS_SHOWN + 1));
  const { data: rows, error } = await supabase
    .from("public_member_profiles")
    .select("member_id, display_name, username, avatar_url, github_username, bio, skills")
    .range(start, start + MEMBERS_SHOWN - 1);

  if (error) {
    console.error("[DashboardHomePage] members query error:", error.message);
    return { members: [], memberCount };
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
  return { members, memberCount };
}

export async function DashboardHomePage() {
  const supabase = createAdminClient();

  const [{ count: registeredCount }, { count: participantCount }, { members, memberCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("participants")
        .select("*", { count: "exact", head: true }),
      loadPublicMembers(supabase),
    ]);

  return (
    <HomeClient
      registeredCount={registeredCount ?? 0}
      participantCount={participantCount ?? 0}
      members={members}
      memberCount={memberCount}
    />
  );
}