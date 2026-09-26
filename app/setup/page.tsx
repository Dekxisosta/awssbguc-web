import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { SetupPage, setupMetadata } from "@/src/_pages/setup";

export const metadata = setupMetadata;

export default async function SetupRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("initial_setup_completed")
    .eq("profile_id", user.id)
    .single();

  if (!profile || profile.initial_setup_completed) redirect("/");

  const { data: membership } = await supabase
    .from("member_roster")
    .select("member_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return <SetupPage memberId={membership?.member_id ?? null} />;
}
