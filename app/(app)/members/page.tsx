import { createAdminClient } from "@/src/shared/supabase/admin";
import { MembersPage } from "@/src/_pages/members";
import type { PublicMemberProfile } from "@/src/entities/member";

export const metadata = { title: "Community — AWSSBG-UC" };

/**
 * Cache the directory listing for 60 seconds.
 * Keeps the page fast for anonymous visitors while staying reasonably fresh.
 * Individual profile opt-ins will appear within one cache window.
 */
export const revalidate = 60;

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function MembersRoute({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // Fetch the opted-in count via the dedicated function (no row data exposed).
  const { data: countRow } = await admin.rpc("count_public_members");
  const totalCount: number = Number(countRow ?? 0);
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  // Fetch one page from the public view.
  // The view already filters on opt-in + at least one social, and orders by display_name.
  const { data: rows, error } = await admin
    .from("public_member_profiles")
    .select("member_id, display_name, username, avatar_url, github_username, discord_id, bio, skills")
    .range(from, to);

  if (error) {
    console.error("[MembersRoute] view query error:", error.message);
    return <MembersPage members={[]} page={page} totalPages={1} totalCount={0} />;
  }

  const members: PublicMemberProfile[] = (rows ?? []).map((r) => ({
    member_id:      r.member_id      as string,
    display_name:   r.display_name   as string | null,
    username:       r.username       as string | null,
    avatar_url:     r.avatar_url     as string | null,
    github_username: r.github_username as string | null,
    discord_id:     r.discord_id     as string | null,
    bio:            r.bio            as string | null,
    skills:         r.skills         as string[] | null,
  }));

  return (
    <MembersPage
      members={members}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}
