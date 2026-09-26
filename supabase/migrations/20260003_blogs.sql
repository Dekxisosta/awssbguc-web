-- =============================================================================
-- Migration: 20260003_blogs.sql
-- Blog posts for the AWSSBG-UC web application.
--
-- Design
-- ------
--   blogs — stores all blog posts. A post can be in one of three states:
--     draft      — not publicly visible; only visible to admin/officer roles.
--     published  — publicly visible to all authenticated users.
--     archived   — hidden from listings; preserved for record-keeping.
--
--   author_participant_id links to participants so the author's display_name
--   can be resolved through the same chain as the rest of the app.
--
--   slug is a URL-friendly unique identifier derived from the title.
--   It is set by the application layer and must be unique across all posts.
--
-- RLS
-- ---
--   anon + authenticated can SELECT rows WHERE status = 'published'.
--   Authenticated users with admin or officer roles can SELECT all rows.
--   No INSERT/UPDATE/DELETE for the authenticated role — all writes go
--   through the service-role admin client, consistent with the rest of
--   the schema.
--
-- Notes
-- -----
--   - service_role bypasses RLS entirely; no explicit policies needed for it.
--   - updated_at is managed by the application layer on each write.
-- =============================================================================


-- =============================================================================
-- SECTION 1: blogs table
-- =============================================================================

CREATE TABLE blogs (
    blog_id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    title                TEXT        NOT NULL,
    slug                 TEXT        NOT NULL,
    excerpt              TEXT,
    content              TEXT,
    cover_image_url      TEXT,
    author_participant_id UUID,
    status               TEXT        NOT NULL DEFAULT 'draft',
    published_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT blogs_pkey          PRIMARY KEY (blog_id),
    CONSTRAINT blogs_slug_unique   UNIQUE (slug),
    CONSTRAINT blogs_status_values CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT blogs_author_fk     FOREIGN KEY (author_participant_id)
        REFERENCES participants (participant_id) ON DELETE SET NULL
);

COMMENT ON TABLE  blogs                        IS 'Blog posts published by AWSSBG-UC. Visible to all authenticated users when status = published.';
COMMENT ON COLUMN blogs.blog_id                IS 'Opaque UUID primary key.';
COMMENT ON COLUMN blogs.title                  IS 'Human-readable post title.';
COMMENT ON COLUMN blogs.slug                   IS 'URL-friendly unique identifier; used in /blogs/<slug> routes.';
COMMENT ON COLUMN blogs.excerpt                IS 'Short summary displayed on listing cards.';
COMMENT ON COLUMN blogs.content                IS 'Full post body. Stored as Markdown; rendered by the client.';
COMMENT ON COLUMN blogs.cover_image_url        IS 'Optional public URL for the post cover image.';
COMMENT ON COLUMN blogs.author_participant_id  IS 'FK to participants.participant_id. NULL if the author row was deleted.';
COMMENT ON COLUMN blogs.status                 IS 'Lifecycle status: draft | published | archived.';
COMMENT ON COLUMN blogs.published_at           IS 'Timestamp when the post was first published. NULL for drafts.';
COMMENT ON COLUMN blogs.created_at             IS 'Row creation timestamp.';
COMMENT ON COLUMN blogs.updated_at             IS 'Last-modified timestamp; updated by the application on every write.';

-- Speed up public listing (status + published_at covers the common ORDER BY).
CREATE INDEX idx_blogs_status         ON blogs (status);
CREATE INDEX idx_blogs_published_at   ON blogs (published_at DESC NULLS LAST);
-- Fast author lookups.
CREATE INDEX idx_blogs_author         ON blogs (author_participant_id);


-- =============================================================================
-- SECTION 2: Row-Level Security
-- =============================================================================

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Any authenticated or anonymous request can read published posts.
CREATE POLICY "blogs: public can read published"
    ON blogs
    FOR SELECT
    TO anon, authenticated
    USING (status = 'published');

-- Admins and officers can read all posts regardless of status.
CREATE POLICY "blogs: admins and officers can read all"
    ON blogs
    FOR SELECT
    TO authenticated
    USING (has_role('admin') OR has_role('officer'));
