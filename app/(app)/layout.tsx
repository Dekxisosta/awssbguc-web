import { createClient } from "@/src/shared/supabase/server";
import { DashboardShell } from "@/src/widgets/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = "Guest";
  let username: string | null = null;
  let avatarUrl: string | null = null;
  let memberId: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("profile_id", user.id)
      .single();

    const { data: participant } = await supabase
      .from("participants")
      .select("member_roster_id")
      .eq("user_id", user.id)
      .maybeSingle();

    displayName = profile?.username ?? user.email ?? "Member";
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    memberId = participant?.member_roster_id ?? null;
  }

  return (
    <DashboardShell
      isAuthenticated={!!user}
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
      memberId={memberId}
    >
      {children}
    </DashboardShell>
  );
}
