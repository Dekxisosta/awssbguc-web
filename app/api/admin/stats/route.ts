import { NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

export const dynamic = "force-dynamic";

async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return false;
  const { data: role } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", data.participant_id)
    .eq("role", "admin")
    .maybeSingle();
  return !!role;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [
    { count: participantCount },
    { count: memberCount },
    { count: accountCount },
    { count: eventCount },
    { count: registrationCount },
  ] = await Promise.all([
    admin.from("participants").select("*", { count: "exact", head: true }),
    admin.from("member_roster").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("events").select("*", { count: "exact", head: true }),
    admin.from("event_registrations").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    participantCount: participantCount ?? 0,
    memberCount:      memberCount      ?? 0,
    accountCount:     accountCount     ?? 0,
    eventCount:       eventCount       ?? 0,
    registrationCount:registrationCount?? 0,
  });
}
