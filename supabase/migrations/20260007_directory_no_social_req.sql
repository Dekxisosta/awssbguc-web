-- =============================================================================
-- MIGRATION 20260007: Remove social-link requirement from public directory
--
-- The view and count function from 20260006 gated visibility on having at
-- least one social link (github_username OR discord_id). That requirement is
-- dropped: opted-in accounts are included regardless of social links.
--
-- discord_id is also removed from the view's SELECT list — the field has
-- no display value in the public directory going forward.
-- =============================================================================


-- =============================================================================
-- SECTION 1: Replace public_member_profiles view
-- =============================================================================

CREATE OR REPLACE VIEW public_member_profiles AS
SELECT
    COALESCE(p.member_roster_id, p.participant_id::TEXT) AS member_id,
    p.display_name,
    pr.username,
    pr.avatar_url,
    pr.github_username,
    pr.bio,
    pr.skills
FROM participants p
JOIN profiles pr ON pr.profile_id = p.user_id
WHERE
    p.status        = 'active'
    AND pr.directory_visible = TRUE
ORDER BY p.display_name ASC;

COMMENT ON VIEW public_member_profiles IS
    'Read-only public directory view. Includes any opted-in active account. '
    'Social links are not required. Never exposes PII, auth tokens, or internal IDs.';


-- =============================================================================
-- SECTION 2: Replace count_public_members()
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
        p.status             = 'active'
        AND pr.directory_visible = TRUE;
$$;

COMMENT ON FUNCTION count_public_members() IS
    'Returns the count of opted-in active accounts in the public directory.';
