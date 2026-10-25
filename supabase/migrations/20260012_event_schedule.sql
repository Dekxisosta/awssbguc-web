-- =============================================================================
-- MIGRATION 20260012: Event schedule / timetable
--
-- Adds an optional, ordered timetable to events (talks, workshops, breaks).
-- NULL means the event has no timetable. Stored as JSONB because a schedule is
-- always read and written together with its event, and events are already
-- publicly readable, so the schedule is public too.
--
-- Shape of each element (validated by the admin API, shape-checked here):
--   {
--     "starts_at":   "2026-03-14T01:00:00Z",   -- required, ISO 8601 timestamptz
--     "ends_at":     "2026-03-14T02:00:00Z",   -- optional
--     "title":       "Intro to Lambda",        -- required
--     "speaker":     "Juan Dela Cruz",         -- optional
--     "description": "Hands-on basics"         -- optional
--   }
--
-- Additive: no existing column or policy changes.
-- =============================================================================

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS schedule JSONB;

ALTER TABLE events
    ADD CONSTRAINT events_schedule_is_array
        CHECK (
            schedule IS NULL
            OR (
                jsonb_typeof(schedule) = 'array'
                AND jsonb_array_length(schedule) BETWEEN 1 AND 50
            )
        );

COMMENT ON COLUMN events.schedule IS
    'Optional timetable: JSON array (1 to 50 items) of {starts_at, ends_at?, title, speaker?, description?}, '
    'sorted by starts_at. NULL = no schedule. Public, like the rest of the event row.';
