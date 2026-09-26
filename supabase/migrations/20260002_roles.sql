-- =============================================================================
-- Migration: 20260002_roles.sql
-- Adds a participant_roles table for role-based access control.
--
-- Design
-- ------
--   participant_roles  — junction table: one row per (participant, role) pair.
--
--   participant_id  →  participants.participant_id  (FK; cascade on delete)
--   role            —  TEXT; values enforced by CHECK constraint.
--
-- Supported roles
-- ---------------
--   admin       — full administrative access
--   officer     — SBG officer; can manage events and members
--   member      — regular verified SBG member (default assigned on provisioning)
--
-- Role ownership / auth chain
-- ---------------------------
--   To know which participant the current user is:
--     auth.uid()  →  participants.user_id  →  participants.participant_id
--
--   RLS on participant_roles uses a correlated sub-select through participants
--   to resolve the caller's participant_id from auth.uid(), matching the same
--   pattern already established in the initial schema.
--
-- Notes
-- -----
--   - A participant may hold multiple roles (e.g. admin + member).
--   - service_role bypasses RLS; all privileged writes use the admin client.
--   - Role assignments are managed via the admin client; no seed data is
--     included in this migration.
-- =============================================================================


-- =============================================================================
-- SECTION 1: participant_roles table
-- =============================================================================

CREATE TABLE participant_roles (
    participant_id UUID NOT NULL,
    role           TEXT NOT NULL,
    granted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by     UUID,                         -- participant_id of the granter; NULL = seeded

    CONSTRAINT participant_roles_pkey
        PRIMARY KEY (participant_id, role),

    CONSTRAINT participant_roles_participant_fk
        FOREIGN KEY (participant_id)
        REFERENCES participants (participant_id)
        ON DELETE CASCADE,

    CONSTRAINT participant_roles_granted_by_fk
        FOREIGN KEY (granted_by)
        REFERENCES participants (participant_id)
        ON DELETE SET NULL,

    CONSTRAINT participant_roles_role_values
        CHECK (role IN ('admin', 'officer', 'member'))
);

COMMENT ON TABLE  participant_roles                IS 'Role assignments for participants. One row per (participant, role) pair.';
COMMENT ON COLUMN participant_roles.participant_id IS 'FK to participants.participant_id. Cascades on participant delete.';
COMMENT ON COLUMN participant_roles.role           IS 'Role name: admin | officer | member.';
COMMENT ON COLUMN participant_roles.granted_at     IS 'Timestamp when the role was granted.';
COMMENT ON COLUMN participant_roles.granted_by     IS 'participant_id of the granting admin. NULL for seeded/system-assigned roles.';

-- Index for fast role lookups by participant.
CREATE INDEX idx_participant_roles_participant_id ON participant_roles (participant_id);
-- Index for listing all holders of a specific role.
CREATE INDEX idx_participant_roles_role ON participant_roles (role);


-- =============================================================================
-- SECTION 2: is_admin() helper function
-- Returns TRUE when the calling auth user holds the 'admin' role.
-- Resolves: auth.uid() → participants.user_id → participant_roles.role
-- Used in RLS policies and can be called from server-side RPCs.
-- =============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM   participants p
        JOIN   participant_roles pr ON pr.participant_id = p.participant_id
        WHERE  p.user_id = auth.uid()
        AND    pr.role = 'admin'
    );
$$;

COMMENT ON FUNCTION is_admin() IS
    'Returns TRUE when the calling auth user holds the admin role. '
    'Resolves auth.uid() through participants to participant_roles.';


-- =============================================================================
-- SECTION 3: has_role(role TEXT) helper function
-- Returns TRUE when the calling auth user holds the given role.
-- =============================================================================

CREATE OR REPLACE FUNCTION has_role(p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM   participants p
        JOIN   participant_roles pr ON pr.participant_id = p.participant_id
        WHERE  p.user_id = auth.uid()
        AND    pr.role = p_role
    );
$$;

COMMENT ON FUNCTION has_role(TEXT) IS
    'Returns TRUE when the calling auth user holds the given role. '
    'Resolves auth.uid() through participants to participant_roles.';


-- =============================================================================
-- SECTION 4: Row-Level Security
--
-- participant_roles is treated as semi-sensitive:
--   - Any authenticated user can read their own role rows.
--   - Admins can read all role rows (enables admin dashboards).
--   - No INSERT/UPDATE/DELETE policies for authenticated users;
--     all writes go through the service-role admin client.
-- =============================================================================

ALTER TABLE participant_roles ENABLE ROW LEVEL SECURITY;

-- A user can read their own role rows.
CREATE POLICY "participant_roles: owner can read own roles"
    ON participant_roles
    FOR SELECT
    TO authenticated
    USING (
        participant_id IN (
            SELECT p.participant_id
            FROM   participants p
            WHERE  p.user_id = auth.uid()
        )
    );

-- Admins can read all role rows.
CREATE POLICY "participant_roles: admins can read all roles"
    ON participant_roles
    FOR SELECT
    TO authenticated
    USING (is_admin());


-- =============================================================================
-- SECTION 5: Function grants
-- Revoke default public execute; grant to authenticated and service_role.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION is_admin()        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION has_role(TEXT)    FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION is_admin()        TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION has_role(TEXT)    TO authenticated, service_role;


-- =============================================================================
-- SECTION 6: (reserved — seed data removed)
-- Admin role assignments are applied via the admin client after provisioning,
-- not hardcoded in migrations.
-- =============================================================================
