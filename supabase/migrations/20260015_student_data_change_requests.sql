-- =============================================================================
-- MIGRATION 20260015: Student data change requests
--
-- Lets a participant who is linked to a membership look at their student_data
-- record and ask for corrections. Nothing is edited directly: the participant
-- files a request, a staff member with `student_data.review` approves or
-- rejects it, and approval applies the change to student_data atomically.
--
-- 1. student_data_change_requests table (+ one-pending-per-participant index).
-- 2. RLS: a participant can read their own requests. All writes go through the
--    Next.js API (service role), like the rest of the schema.
-- 3. `student_data.review` permission for super_admin and admin.
-- 4. review_student_data_change_request(): approve/reject in one transaction.
--
-- Only the fields a participant typed in themselves at membership
-- registration are editable (names, year level, program, section).
-- student_number is the primary key / membership link and is NOT editable
-- through this flow.
-- =============================================================================


-- =============================================================================
-- SECTION 1: Table
-- =============================================================================

CREATE TABLE student_data_change_requests (
    request_id       UUID        NOT NULL DEFAULT gen_random_uuid(),
    participant_id   UUID        NOT NULL,
    -- Snapshot, deliberately not an FK: student_data rows are deleted by the
    -- participant-delete cascade and must never be blocked by a request row.
    student_number   TEXT        NOT NULL,
    -- Only the fields being changed. current_values is what the participant
    -- saw when they filed the request; requested_values is what they want.
    current_values   JSONB       NOT NULL DEFAULT '{}'::JSONB,
    requested_values JSONB       NOT NULL,
    reason           TEXT        NOT NULL,
    status           TEXT        NOT NULL DEFAULT 'pending',
    reviewed_by      UUID,
    reviewed_at      TIMESTAMPTZ,
    review_note      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT sdcr_pkey PRIMARY KEY (request_id),
    CONSTRAINT sdcr_participant_fk FOREIGN KEY (participant_id)
        REFERENCES participants (participant_id) ON DELETE CASCADE,
    CONSTRAINT sdcr_reviewed_by_fk FOREIGN KEY (reviewed_by)
        REFERENCES participants (participant_id) ON DELETE SET NULL,
    CONSTRAINT sdcr_status_values CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
    ),
    CONSTRAINT sdcr_reason_length CHECK (char_length(reason) BETWEEN 10 AND 500),
    CONSTRAINT sdcr_review_note_length CHECK (
        review_note IS NULL OR char_length(review_note) <= 500
    ),
    CONSTRAINT sdcr_requested_is_object CHECK (
        jsonb_typeof(requested_values) = 'object' AND requested_values <> '{}'::JSONB
    ),
    -- Whitelist of editable columns: removing the allowed keys must leave nothing.
    CONSTRAINT sdcr_requested_keys CHECK (
        requested_values - ARRAY['first_name','middle_name','last_name','year_level','program','section'] = '{}'::JSONB
    )
);

COMMENT ON TABLE  student_data_change_requests IS 'Participant-submitted corrections to their student_data record, pending staff review.';
COMMENT ON COLUMN student_data_change_requests.current_values   IS 'The old values of the changed fields, as the participant saw them when filing.';
COMMENT ON COLUMN student_data_change_requests.requested_values IS 'The new values. Only changed fields are present; an empty string clears an optional field.';
COMMENT ON COLUMN student_data_change_requests.status           IS 'pending | approved | rejected | cancelled (withdrawn by the participant).';
COMMENT ON COLUMN student_data_change_requests.review_note      IS 'Staff note shown to the participant; required by the API when rejecting.';

-- A participant can have at most one open request.
CREATE UNIQUE INDEX idx_sdcr_one_pending_per_participant
    ON student_data_change_requests (participant_id)
    WHERE status = 'pending';

CREATE INDEX idx_sdcr_status_created ON student_data_change_requests (status, created_at);
CREATE INDEX idx_sdcr_participant    ON student_data_change_requests (participant_id, created_at DESC);


-- =============================================================================
-- SECTION 2: Row-Level Security
-- =============================================================================

ALTER TABLE student_data_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_data_change_requests: owner can read own requests"
    ON student_data_change_requests
    FOR SELECT
    TO authenticated
    USING (
        participant_id IN (
            SELECT p.participant_id
            FROM   participants p
            WHERE  p.user_id = auth.uid()
        )
    );

-- No INSERT/UPDATE/DELETE policies: writes are service-role only.


-- =============================================================================
-- SECTION 3: Permission
-- =============================================================================

INSERT INTO permissions (name, resource, action) VALUES
    ('student_data.review', 'student_data', 'review')
ON CONFLICT (name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, perm.id
FROM   roles r
JOIN   permissions perm ON perm.name = 'student_data.review'
WHERE  r.name IN ('super_admin', 'admin')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 4: review_student_data_change_request()
--
-- Approve or reject a pending request. Locks the request row so two reviewers
-- cannot both act on it, applies the change to student_data on approval, and
-- records who decided and when. All in one transaction.
--
-- Errors (SQLSTATE):
--   22023  invalid decision
--   P0002  request (or its student record) not found
--   55000  request is no longer pending
-- =============================================================================

CREATE OR REPLACE FUNCTION review_student_data_change_request(
    p_request_id UUID,
    p_reviewer   UUID,
    p_decision   TEXT,
    p_note       TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_req    student_data_change_requests%ROWTYPE;
    v_status TEXT;
BEGIN
    IF p_decision NOT IN ('approve', 'reject') THEN
        RAISE EXCEPTION 'Invalid decision: %', p_decision USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_req
    FROM   student_data_change_requests
    WHERE  request_id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Change request not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_req.status <> 'pending' THEN
        RAISE EXCEPTION 'This request has already been %.', v_req.status USING ERRCODE = '55000';
    END IF;

    IF p_decision = 'approve' THEN
        UPDATE student_data SET
            first_name  = CASE WHEN v_req.requested_values ? 'first_name'  THEN NULLIF(v_req.requested_values ->> 'first_name',  '') ELSE first_name  END,
            middle_name = CASE WHEN v_req.requested_values ? 'middle_name' THEN NULLIF(v_req.requested_values ->> 'middle_name', '') ELSE middle_name END,
            last_name   = CASE WHEN v_req.requested_values ? 'last_name'   THEN NULLIF(v_req.requested_values ->> 'last_name',   '') ELSE last_name   END,
            year_level  = CASE WHEN v_req.requested_values ? 'year_level'  THEN NULLIF(v_req.requested_values ->> 'year_level',  '') ELSE year_level  END,
            program     = CASE WHEN v_req.requested_values ? 'program'     THEN NULLIF(v_req.requested_values ->> 'program',     '') ELSE program     END,
            section     = CASE WHEN v_req.requested_values ? 'section'     THEN NULLIF(v_req.requested_values ->> 'section',     '') ELSE section     END
        WHERE student_number = v_req.student_number;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The student record for this request no longer exists.' USING ERRCODE = 'P0002';
        END IF;
    END IF;

    v_status := CASE WHEN p_decision = 'approve' THEN 'approved' ELSE 'rejected' END;

    UPDATE student_data_change_requests SET
        status      = v_status,
        reviewed_by = p_reviewer,
        reviewed_at = now(),
        review_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
        updated_at  = now()
    WHERE request_id = p_request_id;

    RETURN v_status;
END;
$$;

COMMENT ON FUNCTION review_student_data_change_request(UUID, UUID, TEXT, TEXT) IS
    'Approves (applying requested_values to student_data) or rejects a pending change request '
    'in one transaction. Called only by the admin API through the service role.';

REVOKE EXECUTE ON FUNCTION review_student_data_change_request(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION review_student_data_change_request(UUID, UUID, TEXT, TEXT) TO service_role;
