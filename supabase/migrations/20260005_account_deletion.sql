-- =============================================================================
-- Migration: 20260005_account_deletion.sql
-- Adds soft-delete support for user accounts via participants.
--
-- Design
-- ------
--   When a user requests account deletion:
--     1. participants.deletion_scheduled_at is set to NOW() + 30 days.
--     2. participants.deleted_at remains NULL (not yet hard-deleted).
--
--   The user can cancel within 30 days → deletion_scheduled_at is cleared.
--
--   A scheduled job (pg_cron or Supabase edge function cron) calls
--   process_scheduled_account_deletions() to hard-delete any auth.users rows
--   whose 30-day window has elapsed.  Deleting auth.users cascades:
--     - profiles row deleted (ON DELETE CASCADE)
--     - participants.user_id set to NULL (ON DELETE SET NULL)
--     - participants.deleted_at stamped by the trigger below
--
-- Columns added to participants
-- ------------------------------
--   deletion_scheduled_at  TIMESTAMPTZ  — when the user requested deletion
--                                          (NULL = no active deletion request)
--   deleted_at             TIMESTAMPTZ  — set by trigger after auth user gone
--                                          (NULL = account still live)
-- =============================================================================


-- =============================================================================
-- SECTION 1: Add soft-delete columns to participants
-- =============================================================================

ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS deleted_at            TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN participants.deletion_scheduled_at IS
    'Timestamp at which the user requested account deletion. '
    'Hard deletion of the auth.users row is deferred 30 days from this value. '
    'NULL means no active deletion request.';

COMMENT ON COLUMN participants.deleted_at IS
    'Timestamp at which the auth.users row was actually deleted. '
    'Set automatically by trigger after auth user removal. '
    'NULL while the account is still live.';

-- Fast lookup for the scheduled-deletion cron job.
CREATE INDEX IF NOT EXISTS idx_participants_deletion_scheduled_at
    ON participants (deletion_scheduled_at)
    WHERE deletion_scheduled_at IS NOT NULL;


-- =============================================================================
-- SECTION 2: stamp_participant_deleted_at()
-- Trigger function: when participants.user_id transitions to NULL from a
-- non-NULL value AND deletion_scheduled_at is set, record deleted_at.
-- =============================================================================

CREATE OR REPLACE FUNCTION stamp_participant_deleted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only fire when user_id goes NULL (auth user deleted) and a deletion
    -- was scheduled (i.e. this is an intentional account removal, not an
    -- admin unlink).
    IF (OLD.user_id IS NOT NULL)
       AND (NEW.user_id IS NULL)
       AND (NEW.deletion_scheduled_at IS NOT NULL)
    THEN
        NEW.deleted_at = now();
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION stamp_participant_deleted_at() IS
    'Trigger function: stamps participants.deleted_at when user_id becomes NULL '
    'as part of a scheduled account deletion.';

CREATE OR REPLACE TRIGGER trg_stamp_participant_deleted_at
    BEFORE UPDATE OF user_id ON participants
    FOR EACH ROW
    EXECUTE FUNCTION stamp_participant_deleted_at();


-- =============================================================================
-- SECTION 3: process_scheduled_account_deletions()
-- Called by a cron job (e.g. daily Supabase scheduled function).
-- Hard-deletes auth.users rows for participants whose 30-day window expired.
-- Deleting auth.users cascades: profiles row is removed, participants.user_id
-- is set to NULL (which fires the trigger above).
-- =============================================================================

CREATE OR REPLACE FUNCTION process_scheduled_account_deletions()
RETURNS TABLE (deleted_auth_user_id UUID, participant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.participant_id, p.user_id
        FROM   participants p
        WHERE  p.deletion_scheduled_at IS NOT NULL
          AND  p.deletion_scheduled_at + INTERVAL '30 days' <= now()
          AND  p.user_id IS NOT NULL
          AND  p.deleted_at IS NULL
    LOOP
        -- Hard-delete the auth user. This cascades to profiles (ON DELETE CASCADE)
        -- and sets participants.user_id to NULL (ON DELETE SET NULL).
        DELETE FROM auth.users WHERE id = r.user_id;

        deleted_auth_user_id := r.user_id;
        participant_id        := r.participant_id;
        RETURN NEXT;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION process_scheduled_account_deletions() IS
    'Cron-callable function. Hard-deletes auth.users rows (and thus profiles) for '
    'any participant whose 30-day deletion window has elapsed. '
    'Cascades: profiles deleted, participants.user_id set NULL, deleted_at stamped.';

-- Only service_role may call this; deny all others.
REVOKE EXECUTE ON FUNCTION process_scheduled_account_deletions() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION process_scheduled_account_deletions() TO service_role;
