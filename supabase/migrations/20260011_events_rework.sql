-- =============================================================================
-- MIGRATION 20260011: Events rework (Luma / Meetup style)
--
-- 1. events: cover image, slug, summary, format, venue details, capacity,
--    registration window, tags, host, publish flag, audit columns.
-- 2. Public storage bucket for event cover images.
-- 3. Access policy:
--      - ANYONE (anon + authenticated) can read published events.
--      - Staff holding events.read can also read drafts.
--      - All writes stay service-role only (admin API), as before.
-- 4. Attendee visibility, minimal and obscured:
--      - event_public_attendees : username + avatar for attendees who are
--                                 public members. Nothing else.
--      - event_attendee_counts  : total going, how many are shown by name,
--                                 how many are hidden. Non-public attendees
--                                 only ever appear in the total.
-- 5. Capacity / registration-window guard on event_registrations.
--
-- Additive: no existing column is renamed or dropped, existing events are
-- backfilled (published, slug generated), and existing queries keep working.
-- =============================================================================


-- =============================================================================
-- SECTION 1: New columns on events
-- =============================================================================

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS slug                  TEXT,
    ADD COLUMN IF NOT EXISTS summary               TEXT,
    ADD COLUMN IF NOT EXISTS cover_image_url       TEXT,
    ADD COLUMN IF NOT EXISTS format                TEXT        NOT NULL DEFAULT 'in_person',
    ADD COLUMN IF NOT EXISTS location_address      TEXT,
    ADD COLUMN IF NOT EXISTS location_url          TEXT,
    ADD COLUMN IF NOT EXISTS timezone              TEXT        NOT NULL DEFAULT 'Asia/Manila',
    ADD COLUMN IF NOT EXISTS capacity              INTEGER,
    ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS host_name             TEXT,
    ADD COLUMN IF NOT EXISTS tags                  TEXT[]      NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_published          BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_by            UUID,
    ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE events
    ADD CONSTRAINT events_created_by_fk
        FOREIGN KEY (created_by) REFERENCES participants (participant_id) ON DELETE SET NULL,
    ADD CONSTRAINT events_format_values
        CHECK (format IN ('in_person', 'online', 'hybrid')),
    ADD CONSTRAINT events_capacity_positive
        CHECK (capacity IS NULL OR capacity > 0),
    ADD CONSTRAINT events_registration_window
        CHECK (
            registration_opens_at IS NULL
            OR registration_closes_at IS NULL
            OR registration_closes_at > registration_opens_at
        ),
    ADD CONSTRAINT events_slug_format
        CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT events_summary_length
        CHECK (summary IS NULL OR char_length(summary) <= 200);

COMMENT ON COLUMN events.slug                   IS 'URL-friendly unique identifier (e.g. cloud-day-2026-a1b2c3). Auto-generated from name when not supplied.';
COMMENT ON COLUMN events.summary                IS 'One-line tagline shown on cards (max 200 chars). description holds the long body.';
COMMENT ON COLUMN events.cover_image_url        IS 'Public URL of the cover image in the event-covers storage bucket (or any https URL).';
COMMENT ON COLUMN events.format                 IS 'in_person | online | hybrid.';
COMMENT ON COLUMN events.location               IS 'Venue name (e.g. "AVR, PnC Main Campus"). Public.';
COMMENT ON COLUMN events.location_address       IS 'Street address for the venue. Public.';
COMMENT ON COLUMN events.location_url           IS 'Map link, or public join/livestream page for online events. Public: anyone can read events, so do not store private meeting links here.';
COMMENT ON COLUMN events.timezone               IS 'IANA timezone the event is displayed in.';
COMMENT ON COLUMN events.capacity               IS 'Maximum number of going registrations. NULL = unlimited. Enforced by trigger on event_registrations.';
COMMENT ON COLUMN events.registration_opens_at  IS 'Registration opens at this time. NULL = open immediately.';
COMMENT ON COLUMN events.registration_closes_at IS 'Registration closes at this time. NULL = open until the event ends.';
COMMENT ON COLUMN events.host_name              IS 'Display name of the host or organizing group.';
COMMENT ON COLUMN events.tags                   IS 'Free-form topic tags, e.g. {workshop,serverless}.';
COMMENT ON COLUMN events.is_published           IS 'FALSE = draft. Drafts are hidden from the public and from attendee views; staff with events.read can still see them.';
COMMENT ON COLUMN events.created_by             IS 'Participant who created the event (set by the admin API).';

-- ── Backfill slugs for existing rows ─────────────────────────────────────────
-- slug = slugified name + first 6 chars of the id, which keeps it unique.

CREATE OR REPLACE FUNCTION events_make_slug(p_name TEXT, p_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
               NULLIF(trim(BOTH '-' FROM regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g')), ''),
               'event'
           )
           || '-' || substr(replace(p_id::TEXT, '-', ''), 1, 6);
$$;

UPDATE events
SET    slug = events_make_slug(name, event_id)
WHERE  slug IS NULL;

ALTER TABLE events
    ALTER COLUMN slug SET NOT NULL,
    ADD CONSTRAINT events_slug_unique UNIQUE (slug);

-- ── Triggers: default slug on insert, keep updated_at fresh ──────────────────

CREATE OR REPLACE FUNCTION events_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
        NEW.slug := events_make_slug(NEW.name, NEW.event_id);
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- NOT NULL on slug is safe with this trigger: BEFORE ROW triggers run before
-- constraint checks, so the generated slug is in place by then.

CREATE TRIGGER trg_events_before_write
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION events_before_write();

-- Browse queries: upcoming published events, tag filtering.
CREATE INDEX IF NOT EXISTS idx_events_published_starts ON events (is_published, starts_at);
CREATE INDEX IF NOT EXISTS idx_events_tags             ON events USING GIN (tags);


-- =============================================================================
-- SECTION 2: Storage bucket for cover images
-- Public read (objects are served by URL); writes only via the service role.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-covers',
    'event-covers',
    TRUE,
    5 * 1024 * 1024,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
    SET public             = EXCLUDED.public,
        file_size_limit    = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =============================================================================
-- SECTION 3: events read policy
--
--   anon, authenticated : published events only.
--   authenticated staff : everything, including drafts (events.read).
--
-- The anon and authenticated policies are separate on purpose: has_permission()
-- is not executable by anon, and a policy expression that calls it would error
-- for signed-out visitors.
-- Writes: no policies, so only the service role (admin API) can write.
-- =============================================================================

DROP POLICY IF EXISTS "events: authenticated users can read all events" ON events;
DROP POLICY IF EXISTS "events: anyone can read all events"              ON events;
DROP POLICY IF EXISTS "events: anyone can read published events"        ON events;
DROP POLICY IF EXISTS "events: authenticated can read published or staff all" ON events;

CREATE POLICY "events: anyone can read published events"
    ON events
    FOR SELECT
    TO anon
    USING (is_published);

CREATE POLICY "events: authenticated can read published or staff all"
    ON events
    FOR SELECT
    TO authenticated
    USING (is_published OR has_permission('events.read'));


-- =============================================================================
-- SECTION 4: Attendee views (minimal and obscured)
--
-- Both views run with the owner's rights (like public_member_profiles), so they
-- can read event_registrations / participants / profiles on behalf of anon.
-- They therefore filter explicitly: published events only, and only
-- registrations that count as "going" (registered or attended; no-shows are not
-- counted).
--
-- A registrant is shown by name only if they are a public member:
--   participants.status = 'active'
--   profiles.directory_visible = TRUE   (same opt-in as the members directory)
--   profiles.username IS NOT NULL
-- Everyone else exists only as +1 in the total.
--
-- Never exposed: participant_id, supplied_name, display_name, email, qr_token,
-- student data, registration timestamps, affiliation, note, status.
-- =============================================================================

DROP VIEW IF EXISTS event_public_attendees;
DROP VIEW IF EXISTS event_attendee_counts;

CREATE VIEW event_public_attendees AS
SELECT
    er.event_id,
    pr.username,
    pr.avatar_url
FROM event_registrations er
JOIN events       e  ON e.event_id        = er.event_id
JOIN participants p  ON p.participant_id  = er.participant_id
JOIN profiles     pr ON pr.profile_id     = p.user_id
WHERE e.is_published
  AND er.status IN ('registered', 'attended')
  AND p.status = 'active'
  AND pr.directory_visible = TRUE
  AND pr.username IS NOT NULL
ORDER BY lower(pr.username);

COMMENT ON VIEW event_public_attendees IS
    'Attendees of published events who are public members (directory_visible). '
    'Exposes only event_id, username and avatar_url. Everyone else is counted in '
    'event_attendee_counts but never listed.';

CREATE VIEW event_attendee_counts AS
SELECT
    e.event_id,
    COUNT(er.participant_id)::INTEGER AS total_count,
    (COUNT(er.participant_id) FILTER (
        WHERE p.status = 'active'
          AND pr.directory_visible = TRUE
          AND pr.username IS NOT NULL
    ))::INTEGER AS public_count,
    (COUNT(er.participant_id) - COUNT(er.participant_id) FILTER (
        WHERE p.status = 'active'
          AND pr.directory_visible = TRUE
          AND pr.username IS NOT NULL
    ))::INTEGER AS hidden_count
FROM events e
LEFT JOIN event_registrations er
       ON er.event_id = e.event_id
      AND er.status IN ('registered', 'attended')
LEFT JOIN participants p  ON p.participant_id = er.participant_id
LEFT JOIN profiles     pr ON pr.profile_id    = p.user_id
WHERE e.is_published
GROUP BY e.event_id;

COMMENT ON VIEW event_attendee_counts IS
    'Per published event: total going, how many are public members (listed in '
    'event_public_attendees) and how many are hidden. Events with no '
    'registrations return zeros.';

REVOKE ALL    ON event_public_attendees, event_attendee_counts FROM PUBLIC;
GRANT  SELECT ON event_public_attendees, event_attendee_counts TO anon, authenticated, service_role;


-- =============================================================================
-- SECTION 5: Registration guard (capacity + registration window)
--
-- SECURITY DEFINER: registrations are inserted as the signed-in user, whose RLS
-- only lets them see their own rows. The guard must see every registration to
-- count seats and must be able to lock the event row, so it runs with owner
-- rights (search_path pinned).
--
-- Runs BEFORE INSERT on event_registrations for new 'registered' rows only, so
-- admins can still backfill 'attended' / 'not_attended' rows after the fact.
-- The event row is locked FOR UPDATE so two people racing for the last seat are
-- serialised instead of both getting in.
--
-- Raises exceptions with stable messages the API maps to HTTP errors:
--   EVENT_NOT_FOUND, REGISTRATION_NOT_OPEN, REGISTRATION_CLOSED, EVENT_FULL
-- =============================================================================

CREATE OR REPLACE FUNCTION event_registrations_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event   events%ROWTYPE;
    v_going   INTEGER;
BEGIN
    IF NEW.status <> 'registered' THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_event FROM events WHERE event_id = NEW.event_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    IF v_event.registration_opens_at IS NOT NULL AND now() < v_event.registration_opens_at THEN
        RAISE EXCEPTION 'REGISTRATION_NOT_OPEN';
    END IF;

    IF v_event.registration_closes_at IS NOT NULL AND now() >= v_event.registration_closes_at THEN
        RAISE EXCEPTION 'REGISTRATION_CLOSED';
    END IF;

    IF v_event.capacity IS NOT NULL THEN
        SELECT COUNT(*) INTO v_going
        FROM   event_registrations
        WHERE  event_id = NEW.event_id
          AND  status IN ('registered', 'attended');

        IF v_going >= v_event.capacity THEN
            RAISE EXCEPTION 'EVENT_FULL';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_registrations_guard
    BEFORE INSERT ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION event_registrations_guard();

REVOKE EXECUTE ON FUNCTION event_registrations_guard() FROM PUBLIC;
