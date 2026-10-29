-- =============================================================================
-- MIGRATION 20260018: GitHub repo showcase
--
-- Members with a linked GitHub username can pick up to 3 of their public repos
-- to show on their profile, and attach up to 3 pictures (screenshots of what
-- they built) to each repo.
--
-- 1. profile_repos         : the showcased repos (snapshot of GitHub metadata
--                            + the member's own "what I built" note).
-- 2. profile_repo_images   : pictures per repo, files live in Storage.
-- 3. Limits enforced in the database (not just the API), race-safe:
--      - max 3 repos per profile
--      - max 3 images per repo
-- 4. Storage bucket 'repo-images' (public read; writes are service-role only,
--    through the app's API routes).
-- 5. public_member_repos view: only repos of opted-in, active members whose
--    linked GitHub username still matches the repo owner.
--
-- Writes are service-role only (RLS enabled, no policies), like the rest of
-- the profile data. Files in Storage are removed by the app (see
-- src/shared/lib/account/deletion.ts), because SQL can't reliably delete them.
-- =============================================================================


-- =============================================================================
-- SECTION 1: profile_repos
-- =============================================================================

CREATE TABLE IF NOT EXISTS profile_repos (
    repo_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id  UUID        NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    owner       TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    html_url    TEXT        NOT NULL,
    description TEXT,
    language    TEXT,
    stars       INTEGER     NOT NULL DEFAULT 0,
    note        TEXT,
    position    SMALLINT    NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profile_repos_note_len CHECK (note IS NULL OR char_length(note) <= 280)
);

COMMENT ON TABLE  profile_repos IS 'GitHub repos a member chose to showcase on their profile (max 3 per profile).';
COMMENT ON COLUMN profile_repos.owner       IS 'GitHub owner login. Must match profiles.github_username (enforced by the API, and by the public view).';
COMMENT ON COLUMN profile_repos.description IS 'Snapshot of the GitHub repo description at the time it was added.';
COMMENT ON COLUMN profile_repos.note        IS 'The member''s own short "what I built" text (max 280 chars).';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_repos_unique
    ON profile_repos (profile_id, lower(owner), lower(name));
CREATE INDEX IF NOT EXISTS idx_profile_repos_profile
    ON profile_repos (profile_id, position);

ALTER TABLE profile_repos ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 2: profile_repo_images
-- =============================================================================

CREATE TABLE IF NOT EXISTS profile_repo_images (
    image_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id      UUID        NOT NULL REFERENCES profile_repos(repo_id) ON DELETE CASCADE,
    profile_id   UUID        NOT NULL REFERENCES profiles(profile_id)   ON DELETE CASCADE,
    storage_path TEXT        NOT NULL,
    public_url   TEXT        NOT NULL,
    position     SMALLINT    NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profile_repo_images IS 'Pictures of what a member built, per showcased repo (max 3 per repo). Files live in the repo-images bucket.';
COMMENT ON COLUMN profile_repo_images.storage_path IS 'Object path inside the repo-images bucket: <user id>/<image id>.<ext>.';

CREATE INDEX IF NOT EXISTS idx_profile_repo_images_repo
    ON profile_repo_images (repo_id, position);

ALTER TABLE profile_repo_images ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 3: limits (race-safe: a per-parent advisory lock serialises inserts)
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_profile_repo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended('profile_repos:' || NEW.profile_id::TEXT, 0));
    IF (SELECT COUNT(*) FROM profile_repos WHERE profile_id = NEW.profile_id) >= 3 THEN
        RAISE EXCEPTION 'showcase_repo_limit: at most 3 repos can be showcased';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_repo_limit ON profile_repos;
CREATE TRIGGER trg_profile_repo_limit
    BEFORE INSERT ON profile_repos
    FOR EACH ROW EXECUTE FUNCTION enforce_profile_repo_limit();


CREATE OR REPLACE FUNCTION enforce_profile_repo_image_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended('profile_repo_images:' || NEW.repo_id::TEXT, 0));
    IF (SELECT COUNT(*) FROM profile_repo_images WHERE repo_id = NEW.repo_id) >= 3 THEN
        RAISE EXCEPTION 'showcase_image_limit: at most 3 pictures per repo';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_repo_image_limit ON profile_repo_images;
CREATE TRIGGER trg_profile_repo_image_limit
    BEFORE INSERT ON profile_repo_images
    FOR EACH ROW EXECUTE FUNCTION enforce_profile_repo_image_limit();


-- =============================================================================
-- SECTION 4: storage bucket
-- Public read (URLs are shown on public profiles). No storage policies are
-- added, so only the service role (the app's API routes) can write.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'repo-images',
    'repo-images',
    TRUE,
    3 * 1024 * 1024,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
    SET public             = EXCLUDED.public,
        file_size_limit    = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =============================================================================
-- SECTION 5: public_member_repos view
--
-- A repo is public only when ALL hold:
--   a. the account is active and opted into the directory
--   b. a GitHub username is still linked
--   c. the repo owner matches that username (so changing / removing the link
--      hides stale repos even before the app cleans them up)
-- =============================================================================

CREATE OR REPLACE VIEW public_member_repos AS
SELECT
    pr.username,
    r.repo_id,
    r.owner,
    r.name,
    r.html_url,
    r.description,
    r.language,
    r.stars,
    r.note,
    r.position,
    COALESCE(
        (
            SELECT jsonb_agg(
                       jsonb_build_object('image_id', i.image_id, 'url', i.public_url)
                       ORDER BY i.position, i.created_at
                   )
            FROM profile_repo_images i
            WHERE i.repo_id = r.repo_id
        ),
        '[]'::jsonb
    ) AS images
FROM profile_repos r
JOIN profiles pr     ON pr.profile_id = r.profile_id
JOIN participants p  ON p.user_id     = pr.profile_id
WHERE
    p.status = 'active'
    AND pr.directory_visible = TRUE
    AND pr.github_username IS NOT NULL
    AND lower(pr.github_username) = lower(r.owner)
ORDER BY r.position ASC, r.created_at ASC;

COMMENT ON VIEW public_member_repos IS
    'Read-only public showcase. Only repos of opted-in active members whose linked GitHub username matches the repo owner.';
