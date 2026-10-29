// ---------------------------------------------------------------------------
// Registration / Auth domain types
// ---------------------------------------------------------------------------

/** Fields submitted by the user during normal self-service registration. */
export interface RegisterInput {
  email: string;
  fullName: string;
  password: string;
}

/** Fields submitted during the initial password setup (pre-provisioned accounts). */
export interface SetupInput {
  password: string;
  confirmPassword: string;
}

/** Every field the signup wizard can attach an error to. */
export type RegistrationField =
  | keyof RegisterInput
  | "username"
  | "discordId"
  | "githubUsername"
  | "bio"
  | "skills"
  | "studentNumber"
  | "firstName"
  | "middleName"
  | "lastName"
  | "yearLevel"
  | "program"
  | "section";

/** Optional profile details collected by the signup wizard. */
export interface RegistrationProfileInput {
  username?: string;
  discordId?: string;
  githubUsername?: string;
  bio?: string;
  /** Comma-separated string or a pre-split array. */
  skills?: string | string[];
  /** Show the profile in the public member directory. Defaults to true when omitted. */
  directoryVisible?: boolean;
}

/** Self-reported membership details. Supplying these is what makes someone a member. */
export interface RegistrationMembershipInput {
  studentNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  yearLevel: string;
  program: string;
  section: string;
}

/**
 * Body of POST /api/auth/register. The account fields are required; `profile`
 * and `membership` are optional. Omitting `membership` creates an account
 * without membership.
 */
export interface RegistrationPayload extends RegisterInput {
  profile?: RegistrationProfileInput;
  membership?: RegistrationMembershipInput;
}

/** What happened to the optional membership step after the account was created. */
export type MembershipOutcome =
  | { status: "skipped" }
  | { status: "registered"; memberId: string }
  | { status: "failed"; error: string; field?: RegistrationField };

/** Shape of the JSON body returned by POST /api/auth/register. */
export type RegisterResponse =
  | { success: true; message: string; membership: MembershipOutcome }
  | {
      success: false;
      error: string;
      field?: RegistrationField;
      /** Every field-level error found, so the wizard can flag them all at once. */
      errors?: Partial<Record<RegistrationField, string>>;
    };

/** Shape of the JSON body returned by POST /api/auth/check-availability. */
export type AvailabilityResponse =
  | { success: true; taken: RegistrationField[] }
  | { success: false; error: string };

/** Shape of the JSON body returned by POST /api/auth/setup. */
export type SetupResponse =
  | { success: true }
  | { success: false; error: string; field?: keyof SetupInput };

/** Shape of the JSON body returned by POST /api/auth/login. */
export type LoginResponse =
  | { success: true; requiresSetup: boolean }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Profile (mirrors public.profiles)
// ---------------------------------------------------------------------------

export interface Profile {
  profileId: string;
  username: string | null;
  discordId: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
  initialSetupCompleted: boolean;
}

// ---------------------------------------------------------------------------
// Member roster (mirrors public.member_roster)
// ---------------------------------------------------------------------------

export interface MemberRoster {
  memberId: string;
  studentNumber: string;
}

// ---------------------------------------------------------------------------
// Participant (mirrors public.participants)
// ---------------------------------------------------------------------------

export interface Participant {
  participantId: string;
  suppliedName: string;
  email: string | null;
  memberId: string | null;
  userId: string | null;
  qrToken: string;
  displayName: string;
  status: "active" | "inactive";
}

// ---------------------------------------------------------------------------
// Events (mirrors public.events)
// ---------------------------------------------------------------------------

export type EventStatus = "not_started" | "ongoing" | "completed" | "cancelled";

export interface Event {
  eventId: string;
  name: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
}

// ---------------------------------------------------------------------------
// Event registrations (mirrors public.event_registrations)
// ---------------------------------------------------------------------------

export type RegistrationStatus = "registered" | "attended" | "not_attended";

export interface EventRegistration {
  eventId: string;
  participantId: string;
  affiliation: string | null;
  status: RegistrationStatus;
  createdAt: string;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Admin provisioning types (server-only, never sent to browser)
// ---------------------------------------------------------------------------

export interface ProvisionResult {
  memberId: string;
  studentId: string;
  email: string;
  temporaryPassword: string;
  authUserId: string;
}

export interface ProvisionError {
  memberId: string;
  reason: string;
}

export interface BulkProvisionResult {
  provisioned: Omit<ProvisionResult, "temporaryPassword">[];
  credentials: Pick<ProvisionResult, "memberId" | "studentId" | "email" | "temporaryPassword">[];
  errors: ProvisionError[];
}

// ---------------------------------------------------------------------------
// Participant roles (mirrors public.participant_roles)
// ---------------------------------------------------------------------------

export type RoleName = "admin" | "officer" | "member";

export interface ParticipantRole {
  participantId: string;
  role: RoleName;
  grantedAt: string;
  grantedBy: string | null;
}
