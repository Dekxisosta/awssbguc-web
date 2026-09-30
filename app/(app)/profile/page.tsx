import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { ProfilePage, profileMetadata } from "@/src/_pages/profile";

export const metadata = profileMetadata;

export default async function ProfileRoute() {
  const supabase = createClient();
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
      .select("username, discord_id, avatar_url, github_username")
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
    .select("directory_visible, bio, skills")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <ProfilePage
      fullName={participant?.supplied_name?.trim() || "—"}
      memberId={participant?.member_roster_id ?? null}
      email={user.email ?? "—"}
      initialUsername={profile?.username ?? null}
      discordId={profile?.discord_id ?? null}
      initialAvatarUrl={profile?.avatar_url ?? null}
      githubUsername={profile?.github_username ?? null}
      qrToken={participant?.qr_token ?? null}
      displayName={participant?.display_name ?? null}
      participantId={participant?.participant_id ?? null}
      deletionScheduledAt={participant?.deletion_scheduled_at ?? null}
      directoryVisible={dirProfile?.directory_visible ?? false}
      bio={dirProfile?.bio ?? null}
      skills={(dirProfile?.skills as string[] | null | undefined) ?? null}
    />
  );
}
