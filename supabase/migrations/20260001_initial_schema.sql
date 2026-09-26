-- =============================================================================
-- Migration: 20260001_initial_schema.sql
-- Unified initial schema for the AWS Student Builder Group web application.
--
-- Covers: table definitions, functions, seed data, and RLS policies.
--
-- Identity model
-- --------------
--   participants  — canonical identity layer; owns the auth.users row directly.
--                      ↓                          ↓
--               member_roster               profiles
--               (optional)                 (optional app settings)
--
--   participants.member_roster_id  →  member_roster.member_id  (nullable, unique)
--   participants.user_id           →  auth.users.id            (nullable, unique)
--   profiles.profile_id            →  auth.users.id            (same UUID)
--
--   Auth lives on participants.
--   profiles is an optional app-settings table (username, discord, github, avatar)
--   that hangs off the same auth.users row.  Creating an account means:
--     1. Insert auth.users row.
--     2. Set participants.user_id to that auth.users.id.
--     3. Insert profiles row (profile_id = same auth.users.id).
--
--   member_roster does NOT hold user_id or profile_id; both links are
--   resolved through participants.
--
--   A participant may represent:
--     - a seeded SBG member without an account   (member_roster_id set, user_id null)
--     - a provisioned/registered member          (both set)
--     - an external/guest participant            (both null)
--
-- Role model
-- ----------
--   anon          — unauthenticated requests (Supabase anon key)
--   authenticated — any signed-in user (Supabase JWT present)
--   service_role  — server-side admin client; bypasses RLS entirely
--
-- Notes
-- -----
--   - gen_random_uuid() and sha256() are built-in (PostgreSQL 13+); pgcrypto
--     is not required.
--   - service_role bypasses RLS — no explicit policies are needed for it.
--   - All privileged writes (INSERT profiles, UPDATE participants, etc.) use
--     the admin client and do not require permissive RLS policies.
-- =============================================================================


-- =============================================================================
-- SECTION 1: student_id_counters
-- Atomic per-year sequence for generating formatted SBG-UC-YYXXXX member IDs.
-- Must exist before generate_member_id() and member_roster.
-- =============================================================================

CREATE TABLE student_id_counters (
    year     INTEGER NOT NULL,
    last_seq INTEGER NOT NULL DEFAULT 0 CHECK (last_seq >= 0),

    CONSTRAINT student_id_counters_pkey PRIMARY KEY (year)
);

COMMENT ON TABLE  student_id_counters          IS 'Per-year sequence counters for atomic SBG member ID generation.';
COMMENT ON COLUMN student_id_counters.year     IS 'Four-digit calendar year (e.g. 2026).';
COMMENT ON COLUMN student_id_counters.last_seq IS 'Last issued sequence number for this year; incremented atomically.';


-- =============================================================================
-- SECTION 2: university_roster
-- Replaceable yearly import of PnC-enrolled students.
-- Used only for current-year enrollment validation. Never FK-referenced by
-- persistent tables so it can be wiped and re-imported without cascading.
-- =============================================================================

CREATE TABLE university_roster (
    student_number TEXT NOT NULL,
    first_name     TEXT,
    middle_name    TEXT,
    last_name      TEXT,
    year_level     TEXT,
    program        TEXT,
    section        TEXT,
    date_of_birth  DATE,
    contact_number TEXT,

    CONSTRAINT university_roster_pkey PRIMARY KEY (student_number)
);

COMMENT ON TABLE  university_roster                IS 'Replaceable yearly PnC enrollment snapshot. Never FK-referenced by persistent tables.';
COMMENT ON COLUMN university_roster.student_number IS 'Institutional student number; primary key for this snapshot.';


-- =============================================================================
-- SECTION 3: student_data
-- Persistent, application-owned student records.
-- Survives university_roster replacements. Refreshed on demand by admins.
-- No FK to university_roster — that table is intentionally replaceable.
-- =============================================================================

CREATE TABLE student_data (
    student_number      TEXT    NOT NULL,
    first_name          TEXT,
    middle_name         TEXT,
    last_name           TEXT,
    year_level          TEXT,
    program             TEXT,
    section             TEXT,
    date_of_birth       DATE,
    contact_number      TEXT,
    email               TEXT,
    latest_refresh_year INTEGER,

    CONSTRAINT student_data_pkey PRIMARY KEY (student_number)
);

COMMENT ON TABLE  student_data                     IS 'Persistent application-owned student records. Refreshed from university_roster on demand.';
COMMENT ON COLUMN student_data.student_number      IS 'Institutional student number; stable primary key.';
COMMENT ON COLUMN student_data.email               IS 'Personal contact email from the membership registry.';
COMMENT ON COLUMN student_data.latest_refresh_year IS 'Year of the last successful refresh from university_roster.';

-- Index for name-based lookups used during validation/matching.
CREATE INDEX idx_student_data_last_name ON student_data (last_name);


-- =============================================================================
-- SECTION 4: events
-- Top-level event records. Status transitions are managed by the application.
-- =============================================================================

CREATE TABLE events (
    event_id    UUID        NOT NULL DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    description TEXT,
    location    TEXT,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'not_started',

    CONSTRAINT events_pkey          PRIMARY KEY (event_id),
    CONSTRAINT events_ends_after_start CHECK (ends_at > starts_at),
    CONSTRAINT events_status_values    CHECK (status IN (
        'not_started', 'ongoing', 'completed', 'cancelled'
    ))
);

COMMENT ON TABLE  events           IS 'Events that participants can register for.';
COMMENT ON COLUMN events.event_id  IS 'Opaque UUID primary key.';
COMMENT ON COLUMN events.starts_at IS 'Event start timestamp (timezone-aware).';
COMMENT ON COLUMN events.ends_at   IS 'Event end timestamp; must be after starts_at.';
COMMENT ON COLUMN events.status    IS 'Lifecycle status: not_started | ongoing | completed | cancelled.';

CREATE INDEX idx_events_starts_at ON events (starts_at);
CREATE INDEX idx_events_status    ON events (status);


-- =============================================================================
-- SECTION 5: member_roster
-- Represents a confirmed SBG membership.
-- member_id is the human-facing stable identifier (SBG-UC-YYXXXX).
-- student_number FK points to persistent student_data, not university_roster.
-- The membership ↔ account link is resolved through participants, not here.
-- =============================================================================

CREATE TABLE member_roster (
    member_id      TEXT NOT NULL,
    student_number TEXT NOT NULL,

    CONSTRAINT member_roster_pkey               PRIMARY KEY (member_id),
    CONSTRAINT member_roster_member_id_format   CHECK (member_id ~ '^SBG-UC-[0-9]{6}$'),
    CONSTRAINT member_roster_student_number_fk  FOREIGN KEY (student_number)
        REFERENCES student_data (student_number),
    -- One student → at most one membership.
    CONSTRAINT member_roster_student_number_unique UNIQUE (student_number)
);

COMMENT ON TABLE  member_roster                IS 'SBG membership records. member_id is the stable human-facing identifier.';
COMMENT ON COLUMN member_roster.member_id      IS 'Formatted membership ID: SBG-UC-YYXXXX. Never recycled.';
COMMENT ON COLUMN member_roster.student_number IS 'FK to student_data; the authoritative persistent student record.';


-- =============================================================================
-- SECTION 6: participants
-- The canonical identity and auth-ownership layer.
-- Any person who can attend events lives here.
-- Does NOT require SBG membership or an application account.
--
-- Auth lives here:
--   participants.user_id  →  auth.users.id  (nullable, unique)
--
-- When a participant has an application account, user_id is set to the
-- corresponding auth.users.id.  This makes participants the primary
-- Supabase identity — not profiles.
--
-- profiles is a separate optional row (same UUID as user_id) that stores
-- app-level settings (username, social handles, avatar).  It is an
-- attachment to the participant, not the other way around.
--
-- Optional one-to-one relationship to membership:
--   participants.member_roster_id  →  member_roster.member_id
--
-- qr_token is an opaque random token — not derived from participant_id.
-- display_name is the public-facing identity used in event contexts.
-- supplied_name is the name submitted at registration time; not public identity.
-- =============================================================================

CREATE TABLE participants (
    participant_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    supplied_name    TEXT NOT NULL,
    email            TEXT,
    member_roster_id TEXT,
    user_id          UUID,
    qr_token         TEXT NOT NULL DEFAULT encode(sha256(gen_random_uuid()::text::bytea), 'hex'),
    display_name     TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT participants_pkey                  PRIMARY KEY (participant_id),
    CONSTRAINT participants_email_unique          UNIQUE (email),
    CONSTRAINT participants_qr_token_unique       UNIQUE (qr_token),
    CONSTRAINT participants_display_name_unique   UNIQUE (display_name),
    CONSTRAINT participants_member_roster_id_fk   FOREIGN KEY (member_roster_id)
        REFERENCES member_roster (member_id) ON DELETE SET NULL,
    CONSTRAINT participants_member_roster_id_unique UNIQUE (member_roster_id),
    CONSTRAINT participants_user_id_fk            FOREIGN KEY (user_id)
        REFERENCES auth.users (id) ON DELETE SET NULL,
    CONSTRAINT participants_user_id_unique        UNIQUE (user_id),
    CONSTRAINT participants_status_values         CHECK (status IN ('active', 'inactive'))
);

COMMENT ON TABLE  participants                    IS 'Canonical identity layer. Auth lives here: user_id = auth.users.id. Any person who can participate in events; does not require membership or an account.';
COMMENT ON COLUMN participants.participant_id     IS 'Internal UUID; never exposed as a QR payload.';
COMMENT ON COLUMN participants.supplied_name      IS 'Name as submitted during registration. Not the public identity.';
COMMENT ON COLUMN participants.email              IS 'Optional contact email; unique across participants.';
COMMENT ON COLUMN participants.member_roster_id   IS 'FK to member_roster.member_id; null for guests or external participants. Uniqueness ensures one membership maps to at most one participant.';
COMMENT ON COLUMN participants.user_id            IS 'FK to auth.users.id. Null for participants without an application account. Auth lives on participants — this is the primary identity anchor.';
COMMENT ON COLUMN participants.qr_token           IS 'Opaque random token used in QR codes. Generated as sha256(random UUID) — not derived from participant_id, no pgcrypto required.';
COMMENT ON COLUMN participants.display_name       IS 'Public-facing pseudonymous identity for event contexts.';
COMMENT ON COLUMN participants.status             IS 'Participant account status: active | inactive.';

-- Index for fast user_id lookups (RLS policies, login flows).
CREATE INDEX idx_participants_user_id ON participants (user_id);


-- =============================================================================
-- SECTION 7: profiles
-- Optional app-settings row attached to an authenticated participant.
-- profile_id == auth.users.id == participants.user_id — the same UUID.
--
-- profiles is NOT the primary identity; participants is.
-- profiles stores only app-level presentation data:
--   username, discord_id, github_username, avatar_url, initial_setup_completed.
--
-- Does NOT duplicate student information; student data lives in student_data.
-- =============================================================================

CREATE TABLE profiles (
    profile_id              UUID    NOT NULL,
    username                TEXT,
    discord_id              TEXT,
    github_username         TEXT,
    avatar_url              TEXT,
    initial_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT profiles_pkey              PRIMARY KEY (profile_id),
    CONSTRAINT profiles_auth_user_fk      FOREIGN KEY (profile_id)
        REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT profiles_discord_id_unique UNIQUE (discord_id),
    CONSTRAINT profiles_github_unique     UNIQUE (github_username)
);

COMMENT ON TABLE  profiles                         IS 'App-settings row for an authenticated participant. profile_id = auth.users.id = participants.user_id. Not the primary identity; participants owns the auth anchor.';
COMMENT ON COLUMN profiles.profile_id              IS 'UUID matching auth.users.id (and participants.user_id for the same person).';
COMMENT ON COLUMN profiles.username                IS 'User-chosen display username; case-insensitively unique.';
COMMENT ON COLUMN profiles.discord_id              IS 'Linked Discord user ID.';
COMMENT ON COLUMN profiles.github_username         IS 'Linked GitHub username.';
COMMENT ON COLUMN profiles.avatar_url              IS 'Public URL of the profile avatar stored in the avatars storage bucket.';
COMMENT ON COLUMN profiles.initial_setup_completed IS 'False until the user completes first-login setup (password change for provisioned accounts).';

-- Case-insensitive username uniqueness. Sole uniqueness guarantee for username.
CREATE UNIQUE INDEX idx_profiles_username_ci ON profiles (lower(username));


-- =============================================================================
-- SECTION 8: event_registrations
-- Junction table linking participants to events.
-- Composite PK (event_id, participant_id) — a participant registers at most once.
-- Absence of a row means "not registered".
-- affiliation is event-scoped and may differ per event.
-- created_at doubles as registered_at.
-- =============================================================================

CREATE TABLE event_registrations (
    event_id       UUID        NOT NULL,
    participant_id UUID        NOT NULL,
    affiliation    TEXT,
    status         TEXT        NOT NULL DEFAULT 'registered',
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT event_registrations_pkey           PRIMARY KEY (event_id, participant_id),
    CONSTRAINT event_registrations_event_fk       FOREIGN KEY (event_id)
        REFERENCES events (event_id) ON DELETE CASCADE,
    CONSTRAINT event_registrations_participant_fk FOREIGN KEY (participant_id)
        REFERENCES participants (participant_id) ON DELETE CASCADE,
    CONSTRAINT event_registrations_status_values  CHECK (status IN (
        'registered', 'attended', 'not_attended'
    ))
);

COMMENT ON TABLE  event_registrations                IS 'Registration of a participant in an event. Absence of a row = not registered.';
COMMENT ON COLUMN event_registrations.event_id       IS 'FK to events.';
COMMENT ON COLUMN event_registrations.participant_id IS 'FK to participants.';
COMMENT ON COLUMN event_registrations.affiliation    IS 'Event-scoped affiliation (e.g. section or org); may differ across events.';
COMMENT ON COLUMN event_registrations.status         IS 'Registration status: registered | attended | not_attended.';
COMMENT ON COLUMN event_registrations.created_at     IS 'Timestamp of registration; doubles as registered_at.';

-- Composite PK covers event-first lookups. Add participant-first index.
CREATE INDEX idx_event_registrations_participant ON event_registrations (participant_id);


-- =============================================================================
-- SECTION 9: generate_member_id()
-- Atomically generates the next SBG-UC-YYXXXX member ID for the given year.
--
-- Algorithm:
--   1. Upsert a counter row for the target year (initialises at 0 if absent).
--   2. Increment last_seq by 1 via UPDATE … RETURNING (acquires row-level lock,
--      serialises concurrent calls on the same year row).
--   3. Format the ID: SBG-UC-YY + zero-padded 4-digit sequence.
--   4. Check member_roster for a collision (pre-assigned IDs may occupy the slot).
--      Loop until a free ID is found.
--   5. Return the first available ID.
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_member_id(target_year INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_year      INTEGER;
    v_seq       INTEGER;
    v_yy        TEXT;
    v_candidate TEXT;
    v_exists    BOOLEAN;
BEGIN
    v_year := COALESCE(target_year, EXTRACT(YEAR FROM now())::INTEGER);
    v_yy   := LPAD((v_year % 100)::TEXT, 2, '0');

    LOOP
        INSERT INTO student_id_counters (year, last_seq)
        VALUES (v_year, 1)
        ON CONFLICT (year) DO UPDATE
            SET last_seq = student_id_counters.last_seq + 1
        RETURNING last_seq INTO v_seq;

        IF v_seq > 9999 THEN
            RAISE EXCEPTION
                'SBG member ID sequence exhausted for year %. Maximum is 9999 members per year.',
                v_year;
        END IF;

        v_candidate := 'SBG-UC-' || v_yy || LPAD(v_seq::TEXT, 4, '0');

        SELECT EXISTS (
            SELECT 1 FROM member_roster WHERE member_id = v_candidate
        ) INTO v_exists;

        EXIT WHEN NOT v_exists;
    END LOOP;

    RETURN v_candidate;
END;
$$;

COMMENT ON FUNCTION generate_member_id(INTEGER) IS
    'Atomically generates the next available SBG-UC-YYXXXX member ID for the given year '
    '(defaults to current year). Safe for concurrent calls.';


-- =============================================================================
-- SECTION 10: approve_member_registration()
-- Transactional RPC that validates a student and creates a member_roster record.
--
-- Enrollment validation rule:
--   university_roster is the sole authority for current-year enrollment.
--   student_data is NOT used as a fallback — presence there does not prove
--   current enrollment.
--
-- Steps:
--   1. Look up student_number in university_roster.
--   2. Reject immediately if not found.
--   3. Guard against duplicate membership.
--   4. Upsert student_data from university_roster.
--   5. Atomically generate the member ID.
--   6. Insert the member_roster row.
--   7. Return the created membership record.
-- =============================================================================

CREATE OR REPLACE FUNCTION approve_member_registration(
    p_student_number TEXT,
    p_target_year    INTEGER DEFAULT NULL
)
RETURNS TABLE (
    member_id      TEXT,
    student_number TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_id TEXT;
BEGIN
    -- 1. Validate against current university_roster.
    IF NOT EXISTS (
        SELECT 1 FROM university_roster ur
        WHERE ur.student_number = p_student_number
    ) THEN
        RAISE EXCEPTION
            'Student number % is not present in the current university roster. '
            'Automatic membership approval requires current PnC enrollment.',
            p_student_number
            USING ERRCODE = 'no_data_found';
    END IF;

    -- 2. Guard against duplicate membership.
    IF EXISTS (
        SELECT 1 FROM member_roster mr
        WHERE mr.student_number = p_student_number
    ) THEN
        RAISE EXCEPTION
            'Student number % already has an active SBG membership.',
            p_student_number
            USING ERRCODE = 'unique_violation';
    END IF;

    -- 3. Upsert student_data from university_roster.
    INSERT INTO student_data (
        student_number, first_name, middle_name, last_name,
        year_level, program, section, date_of_birth, contact_number,
        latest_refresh_year
    )
    SELECT
        ur.student_number, ur.first_name, ur.middle_name, ur.last_name,
        ur.year_level, ur.program, ur.section, ur.date_of_birth, ur.contact_number,
        COALESCE(p_target_year, EXTRACT(YEAR FROM now())::INTEGER)
    FROM university_roster ur
    WHERE ur.student_number = p_student_number
    ON CONFLICT (student_number) DO UPDATE SET
        first_name          = EXCLUDED.first_name,
        middle_name         = EXCLUDED.middle_name,
        last_name           = EXCLUDED.last_name,
        year_level          = EXCLUDED.year_level,
        program             = EXCLUDED.program,
        section             = EXCLUDED.section,
        date_of_birth       = EXCLUDED.date_of_birth,
        contact_number      = EXCLUDED.contact_number,
        latest_refresh_year = EXCLUDED.latest_refresh_year;

    -- 4. Atomically generate the member ID.
    v_member_id := generate_member_id(p_target_year);

    -- 5. Insert the membership record.
    INSERT INTO member_roster (member_id, student_number)
    VALUES (v_member_id, p_student_number);

    -- 6. Return the created membership.
    RETURN QUERY
        SELECT mr.member_id, mr.student_number
        FROM member_roster mr
        WHERE mr.member_id = v_member_id;
END;
$$;

COMMENT ON FUNCTION approve_member_registration(TEXT, INTEGER) IS
    'Validates a student against the current university_roster (sole enrollment authority), '
    'upserts student_data, atomically generates a SBG-UC-YYXXXX member ID, and inserts '
    'the member_roster record. Rejects students not in the current roster and prevents '
    'duplicate memberships. Account linking is handled through participants.user_id, not here.';


-- =============================================================================
-- SECTION 11: (reserved — seed data removed)
-- student_data, member_roster, student_id_counters, and participants records
-- are loaded via a separate seed file or admin import process.
-- =============================================================================


-- =============================================================================
-- SECTION 15: Row-Level Security
--
-- General principle:
--   - RLS enabled on every table; default is deny-all.
--   - service_role bypasses RLS — no explicit policies needed for it.
--   - Auth ownership resolves through participants.user_id = auth.uid().
--   - Public data (events) is readable by all authenticated users.
--   - Administrative tables have no anon/authenticated policies (service-role only).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 15a. student_id_counters — internal counter; deny all direct client access.
-- -----------------------------------------------------------------------------
ALTER TABLE student_id_counters ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 15b. university_roster — replaceable import; deny all direct client access.
-- -----------------------------------------------------------------------------
ALTER TABLE university_roster ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 15c. student_data — persistent student records; deny all direct client access.
-- -----------------------------------------------------------------------------
ALTER TABLE student_data ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 15d. events — public information; readable by all authenticated users.
-- -----------------------------------------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: authenticated users can read all events"
    ON events
    FOR SELECT
    TO authenticated
    USING (true);

-- -----------------------------------------------------------------------------
-- 15e. member_roster — a user may read the membership row linked to their
--      participant record. Ownership resolves through participants.user_id.
-- -----------------------------------------------------------------------------
ALTER TABLE member_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_roster: owner can read own membership"
    ON member_roster
    FOR SELECT
    TO authenticated
    USING (
        member_id IN (
            SELECT p.member_roster_id
            FROM   participants p
            WHERE  p.user_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 15f. participants — a participant row is readable by the authenticated user
--      who owns it.
--
--      Ownership is a single equality check: participants.user_id = auth.uid()
--
--      user_id is set when an account is provisioned or self-registered.
--      Seeded rows (awaiting provisioning) have user_id = NULL and are not
--      readable by any authenticated user via RLS — service_role only.
-- -----------------------------------------------------------------------------
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants: owner can read own participant record"
    ON participants
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 15g. profiles — each user may read only their own row.
--      profile_id = auth.users.id = participants.user_id for the same person.
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner can read own row"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 15h. event_registrations — a user may read registrations tied to their own
--      participant record.
--
--      Ownership chain:
--        auth.uid()
--          → participants.user_id
--            → participants.participant_id
--              → event_registrations.participant_id
-- -----------------------------------------------------------------------------
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_registrations: owner can read own registrations"
    ON event_registrations
    FOR SELECT
    TO authenticated
    USING (
        participant_id IN (
            SELECT p.participant_id
            FROM   participants p
            WHERE  p.user_id = auth.uid()
        )
    );


-- =============================================================================
-- SECTION 16: Function grants
-- Revoke default public execute rights on internal functions.
-- Both functions are called exclusively via the service-role client.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION generate_member_id(INTEGER)                     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION approve_member_registration(TEXT, INTEGER)       FROM PUBLIC;

GRANT  EXECUTE ON FUNCTION generate_member_id(INTEGER)                     TO service_role;
GRANT  EXECUTE ON FUNCTION approve_member_registration(TEXT, INTEGER)       TO service_role;
