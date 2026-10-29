import { createAdminClient } from "@/src/shared/supabase/admin";
import { MembersPage } from "@/src/_pages/members";
import type { PublicMemberProfile } from "@/src/entities/member";

export const metadata = { title: "Members — AWSSBG-UC" };

/**
 * Cache the directory listing for 60 seconds.
 * Keeps the page fast for anonymous visitors while staying reasonably fresh.
 * Individual profile opt-ins will appear within one cache window.
 */
export const revalidate = 60;

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function MembersRoute({ searchParams }: Props) {
  const { page: pageParam, q: qParam } = await searchParams;
  // Keep only characters that are safe inside a PostgREST filter (no commas, parens, wildcards or quotes).
  const query = (qParam ?? "").replace(/[^\p{L}\p{N} ._-]/gu, "").trim().slice(0, 40);
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  // Fetch the opted-in count via the dedicated function (no row data exposed).
  const { data: countRow } = await admin.rpc("count_public_members");
  const totalCount: number = Number(countRow ?? 0);

  // Fetch one page from the public view (opt-in only), optionally filtered by name or username.
  let listQuery = admin
    .from("public_member_profiles")
    .select("member_id, display_name, username, avatar_url, github_username, bio, skills", { count: "exact" });
  if (query) {
    listQuery = listQuery.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
  }
  const { data: rows, error, count } = await listQuery.range(from, to);

  if (error) {
    console.error("[MembersRoute] view query error:", error.message);
    return <MembersPage members={[]} page={page} totalPages={1} totalCount={0} query={query} matchCount={0} />;
  }

  // `count` is the number of rows matching the search (exact, from the same query).
  const matchCount = query ? (count ?? 0) : totalCount;
  const totalPages = matchCount > 0 ? Math.ceil(matchCount / PAGE_SIZE) : 1;

  const members: PublicMemberProfile[] = (rows ?? []).map((r) => ({
    member_id:       r.member_id       as string,
    display_name:    r.display_name    as string | null,
    username:        r.username        as string | null,
    avatar_url:      r.avatar_url      as string | null,
    github_username: r.github_username as string | null,
    bio:             r.bio             as string | null,
    skills:          r.skills          as string[] | null,
  }));

  return (
    <MembersPage
      members={members}
      page={page}
      totalPages={totalPages}
      totalCount={totalCount}
      query={query}
      matchCount={matchCount}
    />
  );
}
