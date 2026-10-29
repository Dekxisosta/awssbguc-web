import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { ProfilePage, profileMetadata } from "@/src/_pages/profile";
import { loadOwnShowcase } from "@/src/shared/lib/showcase/service";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import type { MembershipRow } from "@/src/entities/member";
import { loadOwnStudentRecord } from "@/src/shared/lib/student-data/service";

export const metadata = profileMetadata;

export default async function ProfileRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Admin client bypasses RLS — the profiles SELECT policy allows the owner
  // to read their own row, but using the admin client is consistent with how
  // the rest of the app reads profile data server-side and avoids any risk of
  // a policy change silently dropping columns.
  const admin = createAdminClient();

  // Fetch base profile fields (existed before migration 20260006) and
  // participant fields in parallel.
  const [{ data: profile }, { data: participant }] = await Promise.all([
    admin
      .from("profiles")
      .select("username, avatar_url, github_username")
      .eq("profile_id", user.id)
      .single(),
    admin
      .from("participants")
      .select(
        "participant_id, supplied_name, member_roster_id, display_name, qr_token, deletion_scheduled_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Fetch the new directory fields separately so that if migration 20260006
  // has not been applied to this Supabase instance yet, a missing-column error
  // only nulls out the new fields — it never blocks the base profile data.
  const { data: dirProfile } = await admin
    .from("profiles")
    .select("directory_visible, bio, skills, username_changed_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Repo showcase (migration 20260018). If that migration is not applied yet, the page still loads
  // with an empty showcase instead of failing.
  let initialRepos: ShowcaseRepo[] = [];
  try {
    initialRepos = await loadOwnShowcase(admin, user.id);
  } catch (err) {
    console.error("[profile] showcase load failed:", err);
  }

  // Student data, so members see their membership record right on the profile. Change requests and their
  // history stay on /membership. A failure only hides the tile's contents; it never blocks the profile.
  let membership: MembershipRow | null = null;
  let extras: { contact_number: string | null; email: string | null; date_of_birth: string | null } | null = null;
  let membershipUnavailable = false;
  try {
    const record = await loadOwnStudentRecord(user.id);
    if (record) {
      membership = { member_id: record.memberId, student_number: record.studentNumber, student_data: record.values };
      extras = record.extras;
    }
  } catch (err) {
    console.error("[profile] student data load failed:", err);
    membershipUnavailable = true;
  }

  return (
    <ProfilePage
      fullName={participant?.supplied_name?.trim() || "—"}
      memberId={participant?.member_roster_id ?? null}
      email={user.email ?? "—"}
      initialUsername={profile?.username ?? null}
      discordId={null}
      initialAvatarUrl={profile?.avatar_url ?? null}
      githubUsername={profile?.github_username ?? null}
      qrToken={participant?.qr_token ?? null}
      displayName={participant?.display_name ?? null}
      participantId={participant?.participant_id ?? null}
      deletionScheduledAt={participant?.deletion_scheduled_at ?? null}
      directoryVisible={dirProfile?.directory_visible ?? false}
      bio={dirProfile?.bio ?? null}
      skills={(dirProfile?.skills as string[] | null | undefined) ?? null}
      usernameChangedAt={dirProfile?.username_changed_at ?? null}
      initialRepos={initialRepos}
      membership={membership}
      extras={extras}
      membershipUnavailable={membershipUnavailable}
    />
  );
}
