import { NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/src/shared/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.PARTICIPANTS_READ);
  if (deny) return deny;

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
    participantCount:  participantCount  ?? 0,
    memberCount:       memberCount       ?? 0,
    accountCount:      accountCount      ?? 0,
    eventCount:        eventCount        ?? 0,
    registrationCount: registrationCount ?? 0,
  });
}
