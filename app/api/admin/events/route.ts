import { NextResponse, type NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: events, error } = await admin
    .from("events")
    .select("event_id, name, description, location, starts_at, ends_at, status")
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/events]", error.message);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  // Get registration counts per event
  const { data: regCounts } = await admin
    .from("event_registrations")
    .select("event_id, status");

  const countMap = new Map<string, { registered: number; attended: number; not_attended: number }>();
  for (const r of regCounts ?? []) {
    if (!countMap.has(r.event_id)) countMap.set(r.event_id, { registered: 0, attended: 0, not_attended: 0 });
    const bucket = countMap.get(r.event_id)!;
    if (r.status === "registered") bucket.registered++;
    else if (r.status === "attended") bucket.attended++;
    else if (r.status === "not_attended") bucket.not_attended++;
  }

  const result = (events ?? []).map((e) => ({
    ...e,
    registrations: countMap.get(e.event_id) ?? { registered: 0, attended: 0, not_attended: 0 },
  }));

  return NextResponse.json({ events: result });
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { event_id, status } = (body ?? {}) as { event_id?: string; status?: string };
  const VALID = ["not_started", "ongoing", "completed", "cancelled"];
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });
  if (!status || !VALID.includes(status)) return NextResponse.json({ error: `status must be one of: ${VALID.join(", ")}` }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ status }).eq("event_id", event_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await isAdmin(user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { name, description, location, starts_at, ends_at } =
    (body ?? {}) as { name?: string; description?: string; location?: string; starts_at?: string; ends_at?: string };

  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!starts_at)    return NextResponse.json({ error: "starts_at is required" }, { status: 400 });
  if (!ends_at)      return NextResponse.json({ error: "ends_at is required" }, { status: 400 });
  if (new Date(ends_at) <= new Date(starts_at))
    return NextResponse.json({ error: "ends_at must be after starts_at" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .insert({ name: name.trim(), description: description?.trim() ?? null, location: location?.trim() ?? null, starts_at, ends_at })
    .select("event_id, name, starts_at, ends_at, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, event: data }, { status: 201 });
}
