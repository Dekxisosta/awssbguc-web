import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { DashboardShell } from "@/src/widgets/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = "Guest";
  let username: string | null = null;
  let avatarUrl: string | null = null;
  let memberId: string | null = null;
  let isAdmin = false;

  if (user) {
    // Use admin client to bypass RLS — consistent with the profile page.
    // The anon client can read these rows but the admin client is more
    // reliable in layout context where cookie-based auth state may lag.
    const admin = createAdminClient();

    const [{ data: profile }, { data: participant }] = await Promise.all([
      admin
        .from("profiles")
        .select("username, avatar_url")
        .eq("profile_id", user.id)
        .single(),
      admin
        .from("participants")
        .select("participant_id, member_roster_id, display_name")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    // Priority: profile username → participant display_name → email → fallback
    displayName = profile?.username ?? participant?.display_name ?? user.email ?? "Member";
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    memberId = participant?.member_roster_id ?? null;

    // Same rule as the /admin gate in proxy.ts: a participant_roles row with role = 'admin'.
    if (participant) {
      const { data: roleRow } = await admin
        .from("participant_roles")
        .select("role")
        .eq("participant_id", participant.participant_id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = roleRow !== null;
    }
  }

  return (
    <DashboardShell
      isAuthenticated={!!user}
      isAdmin={isAdmin}
      displayName={displayName}
      username={username}
      avatarUrl={avatarUrl}
      memberId={memberId}
    >
      {children}
    </DashboardShell>
  );
}
