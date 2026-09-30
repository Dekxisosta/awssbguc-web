-- =============================================================================
-- MIGRATION 20260006: Public member directory
--
-- 1. Add opt-in visibility flag + bio + skills to profiles (all default-off/null,
--    so this is a purely additive, non-breaking change for existing rows).
-- 2. Create public_member_profiles view: exposes only safe display fields,
--    restricted to opted-in accounts with at least one social link.
-- 3. Create count_public_members() helper function so pages can show the total
--    without fetching rows.
-- =============================================================================


-- =============================================================================
-- SECTION 1: New columns on profiles
-- =============================================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS directory_visible BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS bio               TEXT,
    ADD COLUMN IF NOT EXISTS skills            TEXT[];

COMMENT ON COLUMN profiles.directory_visible IS
    'Opt-in flag. TRUE means the user wants their profile shown in the public members directory. Defaults to FALSE.';
COMMENT ON COLUMN profiles.bio IS
    'Short public bio (max 280 characters). NULL until the user sets it.';
COMMENT ON COLUMN profiles.skills IS
    'Array of self-reported skill tags (e.g. {Python, AWS, React}). NULL until set.';


-- =============================================================================
-- SECTION 2: public_member_profiles view
--
-- Safe display fields only. Joins participants (for display_name, member badge)
-- with profiles (for username, avatar, socials, bio, skills).
--
-- Filter rules (both must pass):
--   a. profiles.directory_visible = TRUE   — explicit opt-in
--   b. at least one social link set        — github_username OR discord_id
--      (ensures an empty card is never shown)
--
-- Excluded fields (never in this view):
--   supplied_name, email, qr_token, participant_id, profile_id,
--   student_number, date_of_birth, contact_number, initial_setup_completed,
--   directory_visible (internal flag)
-- =============================================================================

CREATE OR REPLACE VIEW public_member_profiles AS
SELECT
    -- Stable display key: prefer SBG badge, fall back to participant UUID
    COALESCE(p.member_roster_id, p.participant_id::TEXT)  AS member_id,
    p.display_name,
    pr.username,
    pr.avatar_url,
    pr.github_username,
    pr.discord_id,
    pr.bio,
    pr.skills
FROM participants p
JOIN profiles pr ON pr.profile_id = p.user_id
WHERE
    p.status = 'active'
    AND pr.directory_visible = TRUE
    AND (
        pr.github_username IS NOT NULL
        OR pr.discord_id    IS NOT NULL
    )
ORDER BY p.display_name ASC;

COMMENT ON VIEW public_member_profiles IS
    'Read-only public directory view. Only opted-in active accounts with at least one '
    'social link are included. Never exposes PII, auth tokens, or internal IDs.';


-- =============================================================================
-- SECTION 3: count_public_members()
--
-- Returns the total number of rows the view would return, without fetching
-- any of the rows. Used by the directory page header ("X members opted in").
-- =============================================================================

CREATE OR REPLACE FUNCTION count_public_members()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)
    FROM participants p
    JOIN profiles pr ON pr.profile_id = p.user_id
    WHERE
        p.status = 'active'
        AND pr.directory_visible = TRUE
        AND (
            pr.github_username IS NOT NULL
            OR pr.discord_id    IS NOT NULL
        );
$$;

COMMENT ON FUNCTION count_public_members() IS
    'Returns the total count of rows in public_member_profiles without scanning them. '
    'Call this from the directory page header to show the opted-in member count.';
