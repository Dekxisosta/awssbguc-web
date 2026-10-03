-- =============================================================================
-- MIGRATION 20260008: One-time username change tracking
--
-- Adds username_changed_at to profiles. NULL means the username has never
-- been set by the user (only auto-assigned or blank). A non-NULL value means
-- the user has already exercised their one-time change — further changes
-- must go through an admin.
-- =============================================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.username_changed_at IS
    'Timestamp of the one-time user-initiated username change via PATCH /api/profile. '
    'NULL = user has not yet used their one-time self-service change (regardless of whether '
    'a username was pre-assigned by an admin or left blank). Non-NULL = change has been used; '
    'further self-service changes are blocked. Admins can still update username directly.';
