-- =============================================================================
-- MIGRATION 20260019: one picture per showcased repo
--
-- Lowers the per-repo picture limit set in 20260018 from 3 to 1. Replaces the
-- trigger function only; the trigger itself (trg_profile_repo_image_limit)
-- keeps pointing at it.
--
-- Existing rows are NOT deleted here (SQL can't reliably delete Storage files).
-- If any repo already has more than one picture, the app shows only the first
-- and the member can remove it to replace it. To find any such repos:
--   SELECT repo_id, COUNT(*) FROM profile_repo_images GROUP BY repo_id HAVING COUNT(*) > 1;
-- =============================================================================

CREATE OR REPLACE FUNCTION enforce_profile_repo_image_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended('profile_repo_images:' || NEW.repo_id::TEXT, 0));
    IF (SELECT COUNT(*) FROM profile_repo_images WHERE repo_id = NEW.repo_id) >= 1 THEN
        RAISE EXCEPTION 'showcase_image_limit: at most 1 picture per repo';
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON TABLE profile_repo_images IS
    'Picture of what a member built, per showcased repo (max 1 per repo). Files live in the repo-images bucket.';
