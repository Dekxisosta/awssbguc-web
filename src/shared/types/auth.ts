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

/** Shape of the JSON body returned by POST /api/auth/register. */
export type RegisterResponse =
  | { success: true; message: string }
  | { success: false; error: string; field?: keyof RegisterInput };

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
