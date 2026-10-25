import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/src/shared/lib/rbac";
import {
  EVENT_COLUMNS,
  parseEventInput,
  checkEventWindow,
  removeCoverIfOurs,
} from "@/src/shared/lib/events";

export const dynamic = "force-dynamic";

const SLUG_TAKEN = { error: "That slug is already used by another event" };

/** GET — all events (drafts included) with registration counts. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_READ);
  if (deny) return deny;

  const admin = createAdminClient();

  const { data: events, error } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/events]", error.message);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const { data: regCounts } = await admin.from("event_registrations").select("event_id, status");

  const countMap = new Map<string, { registered: number; attended: number; not_attended: number }>();
  for (const r of regCounts ?? []) {
    if (!countMap.has(r.event_id)) countMap.set(r.event_id, { registered: 0, attended: 0, not_attended: 0 });
    const bucket = countMap.get(r.event_id)!;
    if (r.status === "registered") bucket.registered++;
    else if (r.status === "attended") bucket.attended++;
    else if (r.status === "not_attended") bucket.not_attended++;
  }

  const result = ((events ?? []) as unknown as { event_id: string }[]).map((e) => ({
    ...e,
    registrations: countMap.get(e.event_id) ?? { registered: 0, attended: 0, not_attended: 0 },
  }));

  return NextResponse.json({ events: result });
}

/** POST — create an event. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_CREATE);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseEventInput(body, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const windowError = checkEventWindow(parsed.data);
  if (windowError) return NextResponse.json({ error: windowError }, { status: 400 });

  const admin = createAdminClient();

  const { data: me } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { data, error } = await admin
    .from("events")
    .insert({ ...parsed.data, created_by: me?.participant_id ?? null })
    .select(EVENT_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json(SLUG_TAKEN, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, event: data }, { status: 201 });
}

/**
 * PATCH — update any subset of fields. `{ event_id, status }` still works as a
 * status-only update, so the quick status dropdown keeps its old contract.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_UPDATE);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event_id = (body as { event_id?: unknown } | null)?.event_id;
  if (typeof event_id !== "string" || !event_id)
    return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const parsed = parseEventInput(body, false);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (Object.keys(parsed.data).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("events")
    .select("starts_at, ends_at, registration_opens_at, registration_closes_at, cover_image_url")
    .eq("event_id", event_id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const windowError = checkEventWindow({ ...current, ...parsed.data });
  if (windowError) return NextResponse.json({ error: windowError }, { status: 400 });

  const { error } = await admin.from("events").update(parsed.data).eq("event_id", event_id);
  if (error) {
    if (error.code === "23505") return NextResponse.json(SLUG_TAKEN, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The cover was replaced or cleared: drop the old file if it was one we uploaded.
  if ("cover_image_url" in parsed.data && parsed.data.cover_image_url !== current.cover_image_url) {
    await removeCoverIfOurs(admin, current.cover_image_url);
  }

  return NextResponse.json({ success: true });
}

/** DELETE — delete an event (registrations cascade) and its uploaded cover. */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_DELETE);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_id } = (body ?? {}) as { event_id?: string };
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("events")
    .select("cover_image_url")
    .eq("event_id", event_id)
    .maybeSingle();

  const { error } = await admin.from("events").delete().eq("event_id", event_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await removeCoverIfOurs(admin, existing?.cover_image_url);
  return NextResponse.json({ success: true });
}
