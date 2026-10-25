import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { AdminDashboard } from "@/src/_pages/admin";

export const metadata = { title: "Admin — AWSSBG-UC" };

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await createAdminClient();

  // Resolve participant + confirm admin role server-side
  const { data: participant } = await admin
    .from("participants")
    .select("participant_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant) redirect("/");

  const { data: adminRole } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", participant.participant_id)
    .eq("role", "admin")
    .maybeSingle();

  if (!adminRole) redirect("/");

  return <AdminDashboard callerParticipantId={participant.participant_id} />;
}
