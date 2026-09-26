-- =============================================================================
-- Migration: 20260004_manual_student_registration.sql
-- Drops the university_roster staging table and the eligibility-checking
-- approve_member_registration() function that depended on it, and replaces
-- them with a self-service, manually-entered registration path.
--
-- Rationale
-- ---------
--   The organization no longer imports a yearly university enrollment
--   snapshot to validate membership applications against. Students now type
--   in their own student data (name, year level, program, section) directly
--   on the membership form; there is no external roster to check it against.
--
-- New flow
-- --------
--   register_member_self_reported() upserts the submitted fields into
--   student_data, atomically generates a member_id via the existing
--   generate_member_id() function, and inserts the member_roster row.
--   Linking that membership to the caller's participants row is done by the
--   API route (it already has the authenticated user's id in scope), not
--   inside this function.
--
--   date_of_birth is no longer collected at registration — student_data.
--   date_of_birth stays on the table (historical seeded rows still have it)
--   but is nullable and no longer required or verified.
-- =============================================================================


-- =============================================================================
-- SECTION 1: Drop approve_member_registration()
-- Depended on university_roster; superseded by register_member_self_reported.
-- =============================================================================

DROP FUNCTION IF EXISTS approve_member_registration(TEXT, INTEGER);


-- =============================================================================
-- SECTION 2: Drop university_roster
-- No longer imported/maintained; student data is now self-reported at
-- registration time and stored directly in student_data.
-- =============================================================================

DROP TABLE IF EXISTS university_roster;


-- =============================================================================
-- SECTION 3: register_member_self_reported()
-- Transactional RPC that upserts a self-reported student record and creates
-- a member_roster record for it. No external roster validation — the
-- student number is trusted as entered, guarded only against an existing
-- active membership on the same student number.
-- =============================================================================

CREATE OR REPLACE FUNCTION register_member_self_reported(
    p_student_number TEXT,
    p_first_name     TEXT,
    p_middle_name    TEXT,
    p_last_name      TEXT,
    p_year_level     TEXT,
    p_program        TEXT,
    p_section        TEXT,
    p_target_year    INTEGER DEFAULT NULL
)
RETURNS TABLE (
    member_id      TEXT,
    student_number TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_id TEXT;
BEGIN
    -- 1. Guard against duplicate membership on this student number.
    IF EXISTS (
        SELECT 1 FROM member_roster mr
        WHERE mr.student_number = p_student_number
    ) THEN
        RAISE EXCEPTION
            'Student number % already has an active SBG membership.',
            p_student_number
            USING ERRCODE = 'unique_violation';
    END IF;

    -- 2. Upsert the self-reported student record.
    INSERT INTO student_data (
        student_number, first_name, middle_name, last_name,
        year_level, program, section, latest_refresh_year
    )
    VALUES (
        p_student_number, p_first_name, p_middle_name, p_last_name,
        p_year_level, p_program, p_section,
        COALESCE(p_target_year, EXTRACT(YEAR FROM now())::INTEGER)
    )
    ON CONFLICT (student_number) DO UPDATE SET
        first_name          = EXCLUDED.first_name,
        middle_name         = EXCLUDED.middle_name,
        last_name            = EXCLUDED.last_name,
        year_level           = EXCLUDED.year_level,
        program              = EXCLUDED.program,
        section              = EXCLUDED.section,
        latest_refresh_year  = EXCLUDED.latest_refresh_year;

    -- 3. Atomically generate the member ID.
    v_member_id := generate_member_id(p_target_year);

    -- 4. Insert the membership record.
    INSERT INTO member_roster (member_id, student_number)
    VALUES (v_member_id, p_student_number);

    -- 5. Return the created membership.
    RETURN QUERY
        SELECT mr.member_id, mr.student_number
        FROM member_roster mr
        WHERE mr.member_id = v_member_id;
END;
$$;

COMMENT ON FUNCTION register_member_self_reported(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) IS
    'Upserts a manually self-reported student_data record, atomically generates a '
    'SBG-UC-YYXXXX member ID, and inserts the member_roster record. No external roster '
    'validation — the only guard is against an existing membership on the same student '
    'number. Account linking is handled by the caller through participants.user_id.';

REVOKE EXECUTE ON FUNCTION register_member_self_reported(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION register_member_self_reported(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;
