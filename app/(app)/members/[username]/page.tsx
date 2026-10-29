import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { createClient } from "@/src/shared/supabase/server";
import { MemberDetailPage } from "@/src/_pages/member-detail";
import type { MemberEventSummary, PublicMemberDetail } from "@/src/entities/member";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import { loadPublicShowcase } from "@/src/shared/lib/showcase/service";

/**
 * /members/[username]: public member profile.
 *
 * Bound to the same public directory access as /members: the profile is read from the
 * `public_member_profiles` view, which only contains active accounts that opted in
 * (profiles.directory_visible). Anyone else gets a 404, whether or not the username exists,
 * so the page never confirms that a private account is real.
 *
 * Deliberately not cached: an opt-out must take effect immediately.
 */

interface Props {
  params: Promise<{ username: string }>;
}

/** Same character set the signup flow allows for usernames. */
const USERNAME_RE = /^[A-Za-z0-9_]{1,32}$/;

async function loadMember(raw: string): Promise<PublicMemberDetail | null> {
  if (!USERNAME_RE.test(raw)) return null;

  const admin = createAdminClient();
  const columns = "member_id, display_name, username, avatar_url, github_username, bio, skills";

  // Usernames are stored lowercase, so the exact match is the normal path.
  let { data } = await admin
    .from("public_member_profiles")
    .select(columns)
    .eq("username", raw.toLowerCase())
    .maybeSingle();

  // Accounts provisioned by an admin may carry mixed case. "_" is a LIKE wildcard, so escape it.
  if (!data) {
    ({ data } = await admin
      .from("public_member_profiles")
      .select(columns)
      .ilike("username", raw.replace(/_/g, "\\_"))
      .maybeSingle());
  }
  if (!data) return null;

  return {
    member_id:       data.member_id       as string,
    display_name:    data.display_name    as string | null,
    username:        data.username        as string | null,
    avatar_url:      data.avatar_url      as string | null,
    github_username: data.github_username as string | null,
    bio:             data.bio             as string | null,
    skills:          data.skills          as string[] | null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const member = await loadMember(username);
  if (!member) return { title: "Profile not found — AWSSBG-UC" };

  const name = member.display_name ?? member.username ?? "Member";
  return {
    title: `${name} (@${member.username}) — AWSSBG-UC`,
    description: member.bio ?? `${name} is a member of AWSSBG-UC.`,
  };
}

export default async function MemberDetailRoute({ params }: Props) {
  const { username } = await params;
  const member = await loadMember(username);
  if (!member || !member.username) notFound();

  // One canonical URL per member (the lowercase / stored spelling).
  if (member.username !== username) redirect(`/members/${member.username}`);

  // Events this member appears in publicly. The view only lists public members of published
  // events, and the events query runs under the visitor's own (RLS-governed) session.
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("event_public_attendees")
    .select("event_id")
    .eq("username", member.username)
    .limit(100);

  const eventIds = (rows ?? []).map((r) => r.event_id as string);

  let events: MemberEventSummary[] = [];
  if (eventIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("event_id, slug, name, summary, starts_at, ends_at, timezone, location, status")
      .in("event_id", eventIds)
      .order("starts_at", { ascending: true });
    events = (data ?? []) as unknown as MemberEventSummary[];
  }

  const upcoming = events.filter((e) => e.status === "not_started" || e.status === "ongoing");
  const past = events
    .filter((e) => e.status === "completed" || e.status === "cancelled")
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  // Showcased repos come from the `public_member_repos` view (opted-in members only). A failure, such as the
  // migration not being applied yet, just hides the section.
  let repos: ShowcaseRepo[] = [];
  try {
    repos = await loadPublicShowcase(createAdminClient(), member.username);
  } catch (err) {
    console.error("[members/:username] showcase load failed:", err);
  }

  return <MemberDetailPage member={member} upcoming={upcoming} past={past} repos={repos} />;
}
