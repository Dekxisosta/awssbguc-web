import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/src/shared/supabase/server";
import { EventDetailPage } from "@/src/_pages/event-detail";
import {
  EVENT_PUBLIC_COLUMNS,
  type EventAttendeeCounts,
  type EventPublicAttendee,
  type EventRow,
  type RegistrationRow,
} from "@/src/entities/event";

/**
 * /events/[slug]: public event detail.
 *
 * Reads with the visitor's own session (anon for guests), so RLS decides what is visible:
 * published events only, and the two attendee views only ever expose public members.
 * Drafts therefore 404 for everyone except staff with events.read.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const loadEvent = cache(async (slug: string): Promise<EventRow | null> => {
  if (!SLUG_RE.test(slug) || slug.length > 80) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as EventRow | null) ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) return { title: "Event not found — AWSSBG-UC" };

  const description = event.summary ?? event.description?.slice(0, 200) ?? "An AWSSBG-UC event.";
  return {
    title: `${event.name} — AWSSBG-UC`,
    description,
    openGraph: {
      title: event.name,
      description,
      type: "website",
      ...(event.cover_image_url ? { images: [event.cover_image_url] } : {}),
    },
  };
}

export default async function EventDetailRoute({ params }: Props) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: participant } = user
    ? await supabase.from("participants").select("participant_id").eq("user_id", user.id).maybeSingle()
    : { data: null };

  const [countsRes, attendeesRes, registrationRes] = await Promise.all([
    supabase
      .from("event_attendee_counts")
      .select("event_id, total_count, public_count, hidden_count")
      .eq("event_id", event.event_id)
      .maybeSingle(),
    supabase
      .from("event_public_attendees")
      .select("event_id, username, avatar_url")
      .eq("event_id", event.event_id)
      .limit(200),
    participant
      ? supabase
          .from("event_registrations")
          .select("event_id, status")
          .eq("event_id", event.event_id)
          .eq("participant_id", participant.participant_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // The counts view has a row for every published event; a draft read by staff has none.
  const c = countsRes.data as EventAttendeeCounts | null;
  const counts = {
    total: c?.total_count ?? 0,
    public: c?.public_count ?? 0,
    hidden: c?.hidden_count ?? 0,
  };

  const attendees = ((attendeesRes.data ?? []) as unknown as EventPublicAttendee[]).map((a) => ({
    username: a.username,
    avatar_url: a.avatar_url,
  }));

  const registration = registrationRes.data as Pick<RegistrationRow, "status"> | null;

  // Absolute URL for the calendar entry, from the request's own origin.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const pageUrl = host ? `${proto}://${host}/events/${event.slug}` : null;

  return (
    <EventDetailPage
      event={event}
      counts={counts}
      attendees={attendees}
      registrationStatus={registration?.status ?? null}
      participantId={participant?.participant_id ?? null}
      isSignedIn={!!user}
      pageUrl={pageUrl}
    />
  );
}
