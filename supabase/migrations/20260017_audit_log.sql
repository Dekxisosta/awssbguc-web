-- =============================================================================
-- 20260017 — Audit log
--
-- Append-only record of sensitive admin actions: password reissues, account
-- provisioning, and role changes. Shown in the admin dashboard's Audit tab.
--
-- * Written only by the Next.js API with the service role. RLS is on and no
--   policies exist, and anon/authenticated have no table privileges, so the
--   public anon key cannot read or write it.
-- * Append-only: UPDATE / DELETE / TRUNCATE are blocked by triggers.
-- * No foreign keys on purpose: participants can be deleted (account deletion
--   job), and a FK would either block that or rewrite audit rows. Names are
--   stored as a snapshot in *_label instead, so entries stay readable later.
-- * Never put passwords or tokens in `details`.
--
-- To prune old rows later, drop the two triggers, delete, then recreate them.
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    action                TEXT        NOT NULL,
    outcome               TEXT        NOT NULL DEFAULT 'success'
                                      CHECK (outcome IN ('success', 'denied', 'failed')),
    via                   TEXT        NOT NULL
                                      CHECK (via IN ('session', 'api_secret', 'system')),
    actor_participant_id  UUID,
    actor_label           TEXT,
    target_participant_id UUID,
    target_label          TEXT,
    details               JSONB       NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE  audit_log        IS 'Append-only log of sensitive admin actions. Service-role access only.';
COMMENT ON COLUMN audit_log.action IS 'Dot-notation: password.reissue, account.provision, role.grant, role.revoke, role.create, role.delete, role.permissions_set.';
COMMENT ON COLUMN audit_log.via    IS 'session = signed-in admin; api_secret = ADMIN_API_SECRET bearer token; system = automated.';

CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx     ON audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_target_idx     ON audit_log (target_participant_id, created_at DESC);

-- Locked down: service role only.
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON audit_log FROM anon, authenticated;

-- Append-only.
CREATE OR REPLACE FUNCTION audit_log_block_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_no_row_changes ON audit_log;
CREATE TRIGGER audit_log_no_row_changes
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_block_changes();

DROP TRIGGER IF EXISTS audit_log_no_truncate ON audit_log;
CREATE TRIGGER audit_log_no_truncate
    BEFORE TRUNCATE ON audit_log
    FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_changes();

-- Permission to view it: super_admin and admin.
INSERT INTO permissions (name, resource, action) VALUES
    ('audit.read', 'audit', 'read')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, perm.id
FROM   roles r
JOIN   permissions perm ON perm.name = 'audit.read'
WHERE  r.name IN ('super_admin', 'admin')
ON CONFLICT DO NOTHING;
