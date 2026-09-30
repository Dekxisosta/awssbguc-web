import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { ProfilePage, profileMetadata } from "@/src/_pages/profile";

export const metadata = profileMetadata;

export default async function ProfileRoute() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: participant }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, discord_id, avatar_url, github_username, directory_visible, bio, skills")
      .eq("profile_id", user.id)
      .single(),
    supabase
      .from("participants")
      .select(
        "participant_id, supplied_name, member_roster_id, display_name, qr_token, deletion_scheduled_at"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

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
      directoryVisible={profile?.directory_visible ?? false}
      bio={profile?.bio ?? null}
      skills={(profile?.skills as string[] | null | undefined) ?? null}
    />
  );
}
