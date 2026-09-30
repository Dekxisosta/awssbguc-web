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
    'Timestamp of the one-time user-initiated username change. '
    'NULL = username never set by user. Non-NULL = already used their change.';
