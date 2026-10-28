-- =============================================================================
-- 20260016 — "unregistered" registration status
--
-- Unregistering from an event no longer deletes the row; it sets
-- event_registrations.status = 'unregistered'. Re-registering flips the same row
-- back to 'registered'. The (event_id, participant_id) primary key is unchanged.
--
-- Who can write what:
--   * Users can only READ their own registrations (RLS policy from 20260001).
--   * Every write — register, unregister, and ticking attended / no-show — goes
--     through the API with the service role. The API only lets a signed-in user
--     move their OWN row between 'registered' and 'unregistered'; 'attended' and
--     'not_attended' can only be set by admins.
--   * INSERT / UPDATE / DELETE are revoked from anon + authenticated so that
--     nothing can bypass the API with the public anon key.
--
-- Already unaffected: event_public_attendees and event_attendee_counts only
-- count status IN ('registered', 'attended'), and the capacity guard counts the
-- same two statuses, so unregistered rows free their seat automatically.
-- =============================================================================

-- ── 1. Allow the new status value ────────────────────────────────────────────
ALTER TABLE event_registrations
    DROP CONSTRAINT IF EXISTS event_registrations_status_values;

ALTER TABLE event_registrations
    ADD CONSTRAINT event_registrations_status_values CHECK (status IN (
        'registered', 'attended', 'not_attended', 'unregistered'
    ));

COMMENT ON COLUMN event_registrations.status IS
    'Registration status: registered | attended | not_attended | unregistered. '
    'attended / not_attended are set by admins only; unregistered = the person withdrew.';

-- ── 2. Guard: also run when someone re-registers (unregistered -> registered) ─
-- INSERT keeps the old behaviour (only new 'registered' rows are checked).
-- UPDATE is only checked for unregistered -> registered, so admin edits between
-- registered / attended / not_attended never trip the seat count.
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

    IF TG_OP = 'UPDATE' AND OLD.status <> 'unregistered' THEN
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

DROP TRIGGER IF EXISTS trg_event_registrations_guard ON event_registrations;
CREATE TRIGGER trg_event_registrations_guard
    BEFORE INSERT OR UPDATE OF status ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION event_registrations_guard();

REVOKE EXECUTE ON FUNCTION event_registrations_guard() FROM PUBLIC;

-- ── 3. Writes only through the service role ──────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON event_registrations FROM anon, authenticated;
