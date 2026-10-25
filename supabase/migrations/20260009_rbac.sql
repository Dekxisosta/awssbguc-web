-- =============================================================================
-- MIGRATION 20260009: Permission-based RBAC
--
-- Extends the existing participant_roles system with proper roles and
-- permissions tables. The existing participant_roles.role TEXT column is
-- preserved so is_admin(), has_role(), and the middleware admin gate continue
-- to work without any changes.
--
-- New structure:
--   participants
--     └── participant_roles.role_id → roles.id
--                                        └── role_permissions
--                                                └── permissions.name
--
-- Migration is fully additive — no existing columns are dropped or altered.
--
-- Privilege escalation prevention:
--   Enforced in the TypeScript can() utility and the roles.assign API:
--   a caller can only grant roles whose permission set is a subset of their own.
-- =============================================================================


-- =============================================================================
-- SECTION 1: roles table
-- =============================================================================

CREATE TABLE roles (
    id          UUID    NOT NULL DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    description TEXT,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,  -- system roles cannot be deleted

    CONSTRAINT roles_pkey        PRIMARY KEY (id),
    CONSTRAINT roles_name_unique UNIQUE (name)
);

COMMENT ON TABLE  roles            IS 'Named roles. System roles (is_system=TRUE) cannot be deleted.';
COMMENT ON COLUMN roles.name       IS 'Unique short name, e.g. super_admin, admin, moderator.';
COMMENT ON COLUMN roles.is_system  IS 'TRUE prevents deletion via the API.';

CREATE INDEX idx_roles_name ON roles (name);


-- =============================================================================
-- SECTION 2: permissions table
-- =============================================================================

CREATE TABLE permissions (
    id       UUID NOT NULL DEFAULT gen_random_uuid(),
    name     TEXT NOT NULL,  -- e.g. "participants.read"
    resource TEXT NOT NULL,  -- e.g. "participants"
    action   TEXT NOT NULL,  -- e.g. "read"

    CONSTRAINT permissions_pkey        PRIMARY KEY (id),
    CONSTRAINT permissions_name_unique UNIQUE (name),
    CONSTRAINT permissions_resource_action_unique UNIQUE (resource, action)
);

COMMENT ON TABLE  permissions          IS 'Granular permission entries. name is the canonical identifier used in code.';
COMMENT ON COLUMN permissions.name     IS 'Dot-notation: resource.action, e.g. participants.read.';
COMMENT ON COLUMN permissions.resource IS 'The resource this permission targets.';
COMMENT ON COLUMN permissions.action   IS 'The action allowed on the resource.';

CREATE INDEX idx_permissions_name     ON permissions (name);
CREATE INDEX idx_permissions_resource ON permissions (resource);


-- =============================================================================
-- SECTION 3: role_permissions junction table
-- =============================================================================

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,

    CONSTRAINT role_permissions_pkey
        PRIMARY KEY (role_id, permission_id),

    CONSTRAINT role_permissions_role_fk
        FOREIGN KEY (role_id)
        REFERENCES roles (id)
        ON DELETE CASCADE,

    CONSTRAINT role_permissions_permission_fk
        FOREIGN KEY (permission_id)
        REFERENCES permissions (id)
        ON DELETE CASCADE
);

COMMENT ON TABLE role_permissions IS 'Assigns permissions to roles. Many-to-many.';

CREATE INDEX idx_role_permissions_role       ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions (permission_id);


-- =============================================================================
-- SECTION 4: Add role_id to participant_roles
-- Nullable during migration; NOT NULL enforced after backfill.
-- The existing role TEXT column is preserved for backward compatibility.
-- =============================================================================

ALTER TABLE participant_roles
    ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles (id) ON DELETE SET NULL;

COMMENT ON COLUMN participant_roles.role_id IS
    'FK to roles.id. Backfilled from the role TEXT column during migration 20260009. '
    'Primary source of truth for permissions going forward.';


-- =============================================================================
-- SECTION 5: Seed roles
-- =============================================================================

INSERT INTO roles (id, name, description, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', 'super_admin', 'Full platform access including role management',          TRUE),
    ('00000000-0000-0000-0000-000000000002', 'admin',       'Full admin access; cannot manage role definitions',       TRUE),
    ('00000000-0000-0000-0000-000000000003', 'moderator',   'Can view and manage events; read-only on participants',   TRUE)
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- SECTION 6: Seed permissions
-- =============================================================================

INSERT INTO permissions (name, resource, action) VALUES
    -- Participants
    ('participants.read',    'participants', 'read'),
    ('participants.create',  'participants', 'create'),
    ('participants.update',  'participants', 'update'),
    ('participants.delete',  'participants', 'delete'),
    -- Events
    ('events.read',          'events',       'read'),
    ('events.create',        'events',       'create'),
    ('events.update',        'events',       'update'),
    ('events.delete',        'events',       'delete'),
    -- Roles
    ('roles.read',           'roles',        'read'),
    ('roles.assign',         'roles',        'assign'),
    ('roles.manage',         'roles',        'manage'),   -- create/edit/delete role definitions
    -- Content
    ('content.manage',       'content',      'manage'),
    -- Settings
    ('settings.manage',      'settings',     'manage')
ON CONFLICT (name) DO NOTHING;


-- =============================================================================
-- SECTION 7: Assign permissions to roles
-- =============================================================================

-- super_admin → all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    '00000000-0000-0000-0000-000000000001',
    id
FROM permissions
ON CONFLICT DO NOTHING;

-- admin → all except roles.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    '00000000-0000-0000-0000-000000000002',
    id
FROM permissions
WHERE name != 'roles.manage'
ON CONFLICT DO NOTHING;

-- moderator → events.*, participants.read, roles.read
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    '00000000-0000-0000-0000-000000000003',
    id
FROM permissions
WHERE name IN (
    'participants.read',
    'events.read',
    'events.create',
    'events.update',
    'roles.read'
)
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 8: Backfill participant_roles.role_id from role TEXT column
-- Maps the existing text role names to their seeded UUID rows.
-- =============================================================================

UPDATE participant_roles pr
SET    role_id = r.id
FROM   roles r
WHERE  r.name = pr.role
  AND  pr.role_id IS NULL;


-- =============================================================================
-- SECTION 9: SQL helper functions
-- =============================================================================

-- has_permission(p_permission TEXT)
-- Returns TRUE when the calling auth user holds the given permission
-- through any of their assigned roles.
CREATE OR REPLACE FUNCTION has_permission(p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM   participants      p
        JOIN   participant_roles pr  ON  pr.participant_id = p.participant_id
        JOIN   roles             r   ON  r.id              = pr.role_id
        JOIN   role_permissions  rp  ON  rp.role_id        = r.id
        JOIN   permissions       perm ON perm.id           = rp.permission_id
        WHERE  p.user_id = auth.uid()
        AND    perm.name = p_permission
    );
$$;

COMMENT ON FUNCTION has_permission(TEXT) IS
    'Returns TRUE when the calling auth user holds the named permission through any assigned role. '
    'Resolves auth.uid() → participants → participant_roles → roles → role_permissions → permissions.';

-- get_my_permissions()
-- Returns the set of permission names the calling user holds.
-- Used client-side to drive UI visibility; server-side always re-checks.
CREATE OR REPLACE FUNCTION get_my_permissions()
RETURNS TABLE (permission_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT DISTINCT perm.name
    FROM   participants      p
    JOIN   participant_roles pr  ON  pr.participant_id = p.participant_id
    JOIN   roles             r   ON  r.id              = pr.role_id
    JOIN   role_permissions  rp  ON  rp.role_id        = r.id
    JOIN   permissions       perm ON perm.id           = rp.permission_id
    WHERE  p.user_id = auth.uid();
$$;

COMMENT ON FUNCTION get_my_permissions() IS
    'Returns the distinct set of permission names for the calling auth user. '
    'For UI gating only — server-side handlers always re-validate independently.';


-- =============================================================================
-- SECTION 10: Grants
-- =============================================================================

REVOKE EXECUTE ON FUNCTION has_permission(TEXT)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_my_permissions()  FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION has_permission(TEXT)  TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION get_my_permissions()  TO authenticated, service_role;


-- =============================================================================
-- SECTION 11: RLS on new tables — deny all client access (service_role only)
-- All reads and writes go through the Next.js admin client (service-role key).
-- =============================================================================

ALTER TABLE roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated users.
-- service_role bypasses RLS entirely.
