import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { ProfileSetupPage, profileSetupMetadata } from "@/src/_pages/profile-setup";

export const metadata = profileSetupMetadata;

export default async function ProfileSetupRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/profile-setup");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("username, avatar_url, bio, skills, username_changed_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <ProfileSetupPage
      initialUsername={profile?.username ?? null}
      initialAvatarUrl={profile?.avatar_url ?? null}
      initialBio={profile?.bio ?? null}
      initialSkills={(profile?.skills as string[] | null | undefined) ?? null}
      usernameAlreadyChanged={!!profile?.username_changed_at}
    />
  );
}
