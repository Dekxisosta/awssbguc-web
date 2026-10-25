-- =============================================================================
-- Migration: 20260014_registration_availability.sql
-- Read-only uniqueness pre-check for the multi-step signup wizard.
--
-- The wizard creates nothing until its final step, but flags values that are
-- already taken as the user moves through the form. This function answers
-- "which of these values are already in use?" in one round trip.
--
-- Returns the keys of the fields that are taken, e.g. {email,username}.
-- Only non-NULL, non-empty parameters are checked.
--
-- Comparison rules mirror the real constraints:
--   email           auth.users (lower) OR participants.email (lower)
--   username        profiles, case-insensitive (idx_profiles_username_ci)
--   discord_id      profiles, exact (profiles_discord_id_unique)
--   github_username profiles, case-insensitive (GitHub names are case-insensitive)
--   student_number  member_roster (member_roster_student_number_unique)
--
-- This is advisory only. The database constraints remain the authority, and
-- the registration endpoint re-checks and handles races.
-- =============================================================================

CREATE OR REPLACE FUNCTION check_registration_availability(
    p_email           TEXT DEFAULT NULL,
    p_username        TEXT DEFAULT NULL,
    p_discord_id      TEXT DEFAULT NULL,
    p_github_username TEXT DEFAULT NULL,
    p_student_number  TEXT DEFAULT NULL
)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_taken TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF COALESCE(btrim(p_email), '') <> '' AND (
        EXISTS (SELECT 1 FROM auth.users u    WHERE lower(u.email) = lower(btrim(p_email)))
     OR EXISTS (SELECT 1 FROM participants pt WHERE lower(pt.email) = lower(btrim(p_email)))
    ) THEN
        v_taken := v_taken || 'email';
    END IF;

    IF COALESCE(btrim(p_username), '') <> ''
       AND EXISTS (SELECT 1 FROM profiles pr WHERE lower(pr.username) = lower(btrim(p_username))) THEN
        v_taken := v_taken || 'username';
    END IF;

    IF COALESCE(btrim(p_discord_id), '') <> ''
       AND EXISTS (SELECT 1 FROM profiles pr WHERE pr.discord_id = btrim(p_discord_id)) THEN
        v_taken := v_taken || 'discordId';
    END IF;

    IF COALESCE(btrim(p_github_username), '') <> ''
       AND EXISTS (SELECT 1 FROM profiles pr WHERE lower(pr.github_username) = lower(btrim(p_github_username))) THEN
        v_taken := v_taken || 'githubUsername';
    END IF;

    IF COALESCE(btrim(p_student_number), '') <> ''
       AND EXISTS (SELECT 1 FROM member_roster mr WHERE mr.student_number = btrim(p_student_number)) THEN
        v_taken := v_taken || 'studentNumber';
    END IF;

    RETURN v_taken;
END;
$$;

COMMENT ON FUNCTION check_registration_availability(TEXT, TEXT, TEXT, TEXT, TEXT) IS
    'Advisory uniqueness pre-check for the signup wizard. Returns the keys of fields whose values are already taken.';

REVOKE EXECUTE ON FUNCTION check_registration_availability(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION check_registration_availability(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
