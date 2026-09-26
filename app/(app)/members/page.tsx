import { createAdminClient } from "@/src/shared/supabase/admin";
import { MembersPage, membersMetadata } from "@/src/_pages/members";
import type { PublicMemberProfile } from "@/src/entities/member";

export const metadata = membersMetadata;

const PAGE_SIZE = 20;

interface Props {
  searchParams: { page?: string };
}

export default async function MembersRoute({ searchParams }: Props) {
  const admin = createAdminClient();

  // Parse and clamp the page number.
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetch one page of active participants, sorted by display_name, with total count.
  const { data: participants, error, count } = await admin
    .from("participants")
    .select("participant_id, user_id, member_roster_id, display_name", { count: "exact" })
    .eq("status", "active")
    .order("display_name", { ascending: true })
    .range(from, to);

  if (error) {
    return <MembersPage members={[]} page={page} totalPages={1} />;
  }

  const list = participants ?? [];
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

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
    const { data: profiles } = await admin
      .from("profiles")
      .select("profile_id, username, avatar_url, github_username, discord_id")
      .in("profile_id", userIds);
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

  return (
    <MembersPage
      members={members}
      page={page}
      totalPages={totalPages}
      totalCount={count ?? 0}
    />
  );
}
