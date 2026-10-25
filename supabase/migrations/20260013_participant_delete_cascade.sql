-- =============================================================================
-- Migration: 20260013_participant_delete_cascade.sql
-- Deleting a participant must also delete its profile, member_roster row,
-- student_data row and auth user (DPA erasure).
--
-- Why this was broken
-- -------------------
--   The FKs point the wrong way for a cascade from participants:
--     participants.user_id          -> auth.users.id        ON DELETE SET NULL
--     participants.member_roster_id -> member_roster        ON DELETE SET NULL
--     profiles.profile_id           -> auth.users.id        ON DELETE CASCADE
--   profiles and member_roster have no FK to participants, so deleting a
--   participant row cannot cascade to them. A trigger is the only way to
--   enforce it, because the child side owns the FK.
--
--   process_scheduled_account_deletions() also only deleted auth.users, which
--   left the participants + member_roster rows behind.
--
-- Already cascading: event_registrations / participant_roles (ON DELETE CASCADE).
-- Not handled in SQL: avatar files in the 'avatars' storage bucket. Deleting
-- storage.objects rows from SQL does not reliably remove the files, so the
-- app removes them first (src/shared/lib/account/deletion.ts). A participant
-- deleted by hand in SQL / the dashboard will leave its avatar behind.
-- =============================================================================

CREATE OR REPLACE FUNCTION cascade_participant_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_student_number TEXT;
BEGIN
    IF OLD.user_id IS NOT NULL THEN
        DELETE FROM profiles WHERE profile_id = OLD.user_id;
        -- Remove the login too so no auth account outlives its participant.
        DELETE FROM auth.users WHERE id = OLD.user_id;
    END IF;

    IF OLD.member_roster_id IS NOT NULL THEN
        -- member_roster must go first: it holds the FK to student_data.
        DELETE FROM member_roster
        WHERE  member_id = OLD.member_roster_id
        RETURNING student_number INTO v_student_number;

        IF v_student_number IS NOT NULL THEN
            DELETE FROM student_data WHERE student_number = v_student_number;
        END IF;
    END IF;

    RETURN OLD;
END;
$$;

COMMENT ON FUNCTION cascade_participant_delete() IS
    'AFTER DELETE trigger on participants: removes the linked profiles row, '
    'auth.users row, member_roster row and student_data row.';

REVOKE EXECUTE ON FUNCTION cascade_participant_delete() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_cascade_participant_delete ON participants;
CREATE TRIGGER trg_cascade_participant_delete
    AFTER DELETE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION cascade_participant_delete();


-- Scheduled deletion now removes the participant (the trigger does the rest).
--
-- Also fixes the due-date check: the API stores deletion_scheduled_at as the
-- date the account will be deleted (now + 30 days; the UI shows it as such),
-- but the old function added another 30 days, so deletion ran after ~60 days.
--
-- NOTE: this function cannot remove avatar files. Production deletions run
-- through /api/cron/account-deletions, which does. Use one or the other, not
-- both, and prefer the route.
CREATE OR REPLACE FUNCTION process_scheduled_account_deletions()
RETURNS TABLE (deleted_auth_user_id UUID, participant_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT p.participant_id, p.user_id
        FROM   participants p
        WHERE  p.deletion_scheduled_at IS NOT NULL
          AND  p.deletion_scheduled_at <= now()
          AND  p.user_id IS NOT NULL
          AND  p.deleted_at IS NULL
    LOOP
        DELETE FROM participants WHERE participants.participant_id = r.participant_id;

        deleted_auth_user_id := r.user_id;
        participant_id       := r.participant_id;
        RETURN NEXT;
    END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION process_scheduled_account_deletions() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION process_scheduled_account_deletions() TO service_role;


-- =============================================================================
-- One-off cleanup of rows already orphaned. Review before running; not
-- executed automatically because seeded members legitimately have a
-- member_roster row with no participant, and profiles are briefly created
-- before their participant during signup.
-- =============================================================================
-- SELECT pr.profile_id FROM profiles pr
--   WHERE NOT EXISTS (SELECT 1 FROM participants p WHERE p.user_id = pr.profile_id);
--
-- SELECT mr.member_id FROM member_roster mr
--   WHERE NOT EXISTS (SELECT 1 FROM participants p WHERE p.member_roster_id = mr.member_id);
--
-- SELECT sd.student_number FROM student_data sd
--   WHERE NOT EXISTS (SELECT 1 FROM member_roster mr WHERE mr.student_number = sd.student_number);
