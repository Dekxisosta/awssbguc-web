/**
 * src/shared/lib/account/service.ts
 *
 * Server-only. All privileged account operations live here so the
 * provisioning flow and the normal registration flow share the same
 * core logic rather than duplicating it.
 *
 * Never import this file in Client Components or browser bundles.
 * Every function that touches the DB requires the Supabase admin client
 * (service-role key) so that it bypasses RLS.
 */

import { createAdminClient } from "@/src/shared/supabase/admin";
import type {
  ProvisionResult,
  ProvisionError,
  BulkProvisionResult,
  RoleName,
  ParticipantRole,
} from "@/src/shared/types/auth";

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type AdminClient = ReturnType<typeof createAdminClient>;

interface MemberRosterRow {
  member_id: string;
  student_number: string;
}

interface StudentDataRow {
  student_number: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
}

// ---------------------------------------------------------------------------
// Password utilities
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically random temporary password.
 * Format: 4 segments of 4 chars from a safe alphabet, joined by hyphens.
 * Example: Xk9P-mQ2r-Wj7N-Tz4V
 */
export function generateTemporaryPassword(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const segmentLength = 4;
  const segments = 4;
  const bytes = new Uint8Array(segmentLength * segments);
  crypto.getRandomValues(bytes);

  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let segment = "";
    for (let i = 0; i < segmentLength; i++) {
      segment += alphabet[bytes[s * segmentLength + i] % alphabet.length];
    }
    parts.push(segment);
  }
  return parts.join("-");
}

/**
 * Validate a user-chosen password.
 * Returns null if valid, or an error string if not.
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 72) {
    return "Password must be 72 characters or fewer.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Display name utilities
// ---------------------------------------------------------------------------

const ADJECTIVES = [
  "Amber","Azure","Blaze","Brave","Bright","Calm","Clear","Cloud",
  "Coral","Crisp","Dusk","Early","Ember","Fair","Fell","Firm",
  "Fleet","Frost","Gold","Grand","Green","Grey","High","Iron",
  "Jade","Kind","Lake","Light","Lime","Lone","Mist","Moon",
  "Near","Night","North","Opal","Peak","Pine","Pure","Quick",
  "Rain","Rapid","River","Rose","Royal","Ruby","Sage","Sand",
  "Sharp","Shore","Silver","Sky","Slate","Slim","Snow","Solar",
  "South","Star","Steel","Still","Stone","Storm","Strong","Sun",
  "Swift","Tall","Teal","Thin","Thor","Tide","True","Vast",
  "Warm","West","Wild","Wind","Wise","Wood","Young","Zeal",
];

const NOUNS = [
  "Anchor","Apex","Arch","Arrow","Ash","Axe","Bay","Bear",
  "Berg","Bird","Blade","Bloom","Bolt","Book","Bow","Branch",
  "Bridge","Brook","Buck","Cape","Cave","Cedar","Cliff","Cloud",
  "Coast","Core","Cove","Creek","Crest","Crow","Crown","Dawn",
  "Deer","Dell","Den","Depth","Dove","Drake","Dune","Eagle",
  "Edge","Elm","Fern","Field","Finch","Fire","Flint","Flow",
  "Flux","Ford","Forge","Fork","Fox","Gate","Glen","Grove",
  "Hawk","Heath","Hill","Horn","Hull","Hunter","Isle","Lark",
  "Leaf","Light","Link","Lion","Marsh","Mead","Mesa","Mill",
  "Moor","Mount","Oak","Path","Peak","Pine","Pool","Port",
  "Quill","Reef","Ridge","Ring","Rock","Root","Run","Rush",
];

/**
 * Generate a pseudonymous display name candidate.
 * Format: <Adjective><Noun><4-digit-suffix>
 */
export function generatePseudonymousDisplayName(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  const adjIdx  = ((bytes[0] << 8) | bytes[1]) % ADJECTIVES.length;
  const nounIdx = ((bytes[2] << 8) | bytes[3]) % NOUNS.length;
  const suffix  = String(1000 + (((bytes[4] << 8) | bytes[5]) % 9000));

  return ADJECTIVES[adjIdx] + NOUNS[nounIdx] + suffix;
}

/**
 * Validate that a display name satisfies the format constraint.
 * Returns null if valid, or an error string if not.
 */
export function validateDisplayName(displayName: string): string | null {
  if (!/^[A-Za-z][A-Za-z0-9_]{5,23}$/.test(displayName)) {
    return (
      "Display name must be 6–24 characters, start with a letter, " +
      "and contain only letters, numbers, and underscores."
    );
  }
  return null;
}

async function isDisplayNameTaken(
  supabase: AdminClient,
  displayName: string,
  excludeParticipantId?: string
): Promise<boolean> {
  let query = supabase
    .from("participants")
    .select("participant_id")
    .ilike("display_name", displayName);

  if (excludeParticipantId) {
    query = query.neq("participant_id", excludeParticipantId);
  }

  const { data } = await query.maybeSingle();
  return data !== null;
}

async function resolveUniqueDisplayName(
  supabase: AdminClient,
  excludeParticipantId?: string
): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = generatePseudonymousDisplayName();
    if (!(await isDisplayNameTaken(supabase, candidate, excludeParticipantId))) {
      return candidate;
    }
  }
  return generatePseudonymousDisplayName() + String(Date.now()).slice(-4);
}

async function isUsernameTaken(
  supabase: AdminClient,
  username: string,
  excludeProfileId?: string
): Promise<boolean> {
  let query = supabase
    .from("profiles")
    .select("profile_id")
    .ilike("username", username);

  if (excludeProfileId) {
    query = query.neq("profile_id", excludeProfileId);
  }

  const { data } = await query.maybeSingle();
  return data !== null;
}

async function resolveUniqueUsername(
  supabase: AdminClient,
  base: string,
  excludeProfileId?: string
): Promise<string> {
  let candidate = base;
  let counter = 0;

  while (await isUsernameTaken(supabase, candidate, excludeProfileId)) {
    counter += 1;
    const suffix = String(counter);
    const trimmed = base.slice(0, 24 - suffix.length);
    candidate = trimmed + suffix;
  }

  return candidate;
}

// ---------------------------------------------------------------------------
// Profile creation
// ---------------------------------------------------------------------------

interface CreateProfileInput {
  authUserId: string;
  initialSetupCompleted: boolean;
  username: string | null;
}

async function createProfile(
  supabase: AdminClient,
  input: CreateProfileInput
): Promise<void> {
  const { error } = await supabase.from("profiles").insert({
    profile_id: input.authUserId,
    initial_setup_completed: input.initialSetupCompleted,
    username: input.username,
  });

  if (error) {
    throw new Error(`Profile insert failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Participant creation / linking
// ---------------------------------------------------------------------------

async function createParticipantForMember(
  supabase: AdminClient,
  opts: {
    authUserId: string;
    memberId: string;
    suppliedName: string;
    email: string;
  }
): Promise<void> {
  const displayName = await resolveUniqueDisplayName(supabase);

  const { error: insertErr } = await supabase.from("participants").insert({
    supplied_name:    opts.suppliedName,
    email:            opts.email,
    member_roster_id: opts.memberId,
    user_id:          opts.authUserId,
    display_name:     displayName,
  });

  if (insertErr) {
    console.error(
      `[createParticipantForMember] failed for member ${opts.memberId}:`,
      insertErr.message
    );
    return;
  }

  const username = await resolveUniqueUsername(supabase, displayName, opts.authUserId);

  const { error: usernameErr } = await supabase
    .from("profiles")
    .update({ username })
    .eq("profile_id", opts.authUserId)
    .is("username", null);

  if (usernameErr) {
    console.error(
      `[createParticipantForMember] failed to set username for profile ${opts.authUserId}:`,
      usernameErr.message
    );
  }
}

async function linkParticipantToAuthUser(
  supabase: AdminClient,
  memberId: string,
  authUserId: string
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({ user_id: authUserId })
    .eq("member_roster_id", memberId)
    .is("user_id", null);

  if (error) {
    console.error(
      `[linkParticipantToAuthUser] failed to link participant for ${memberId} → ${authUserId}:`,
      error.message
    );
  }
}

// ---------------------------------------------------------------------------
// FLOW 1: Provision a pre-existing member by member_id
// ---------------------------------------------------------------------------

export interface ProvisionMemberInput {
  memberId: string;
  email: string;
}

export async function provisionMemberWithEmail(
  input: ProvisionMemberInput
): Promise<ProvisionResult> {
  const supabase = createAdminClient();
  const { memberId, email } = input;

  const { data: rosterData, error: rosterError } = await supabase
    .from("member_roster")
    .select("member_id, student_number")
    .eq("member_id", memberId)
    .single();

  if (rosterError || !rosterData) {
    throw new Error(`Member roster record "${memberId}" not found.`);
  }

  const roster = rosterData as MemberRosterRow;

  const { data: existingParticipant } = await supabase
    .from("participants")
    .select("user_id")
    .eq("member_roster_id", memberId)
    .maybeSingle();

  if (existingParticipant?.user_id) {
    throw new Error(
      `Member "${memberId}" already has a linked auth account (${existingParticipant.user_id}).`
    );
  }

  let fullName = `Member ${memberId}`;

  const { data: studentData } = await supabase
    .from("student_data")
    .select("first_name, middle_name, last_name")
    .eq("student_number", roster.student_number)
    .maybeSingle();

  if (studentData) {
    const sd = studentData as StudentDataRow;
    const derived = [sd.first_name, sd.middle_name, sd.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (derived) fullName = derived;
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError || !authData.user) {
    throw new Error(`Auth user creation failed: ${authError?.message}`);
  }

  const authUserId = authData.user.id;

  try {
    await createProfile(supabase, {
      authUserId,
      initialSetupCompleted: false,
      username: null,
    });
  } catch (profileErr) {
    await supabase.auth.admin.deleteUser(authUserId);
    throw profileErr;
  }

  try {
    await linkParticipantToAuthUser(supabase, memberId, authUserId);
  } catch (linkErr) {
    console.error("[provisionMemberWithEmail] linkParticipantToAuthUser failed:", linkErr);
  }

  const { data: linkedParticipant } = await supabase
    .from("participants")
    .select("participant_id")
    .eq("member_roster_id", memberId)
    .maybeSingle();

  if (!linkedParticipant) {
    await createParticipantForMember(supabase, {
      authUserId,
      memberId,
      suppliedName: fullName,
      email,
    });
  }

  return {
    memberId,
    studentId: memberId,
    email,
    temporaryPassword,
    authUserId,
  };
}

export async function provisionMembersWithEmail(
  inputs: ProvisionMemberInput[]
): Promise<BulkProvisionResult> {
  const provisioned: BulkProvisionResult["provisioned"] = [];
  const credentials: BulkProvisionResult["credentials"] = [];
  const errors: ProvisionError[] = [];

  for (const input of inputs) {
    try {
      const result = await provisionMemberWithEmail(input);
      const { temporaryPassword, ...rest } = result;
      provisioned.push(rest);
      credentials.push({
        memberId: result.memberId,
        studentId: result.studentId,
        email: result.email,
        temporaryPassword,
      });
    } catch (err) {
      errors.push({
        memberId: input.memberId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { provisioned, credentials, errors };
}

// ---------------------------------------------------------------------------
// FLOW 2: Normal self-service registration
// ---------------------------------------------------------------------------

export interface RegisterMemberInput {
  email: string;
  fullName: string;
  password: string;
}

export interface RegisterMemberResult {
  authUserId: string;
}

export async function registerMember(
  input: RegisterMemberInput
): Promise<RegisterMemberResult> {
  const supabase = createAdminClient();

  const sanitizedEmail = input.email.trim().toLowerCase();
  const sanitizedName  = input.fullName.trim();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: sanitizedName },
    });

  if (authError || !authData.user) {
    const isDuplicate =
      authError?.message.toLowerCase().includes("already registered") ||
      authError?.code === "email_exists";
    throw Object.assign(
      new Error(
        isDuplicate
          ? "An account with that email already exists."
          : `Auth user creation failed: ${authError?.message}`
      ),
      { code: isDuplicate ? "email_taken" : "auth_error", field: isDuplicate ? "email" : undefined }
    );
  }

  const authUserId = authData.user.id;

  try {
    await createProfile(supabase, {
      authUserId,
      initialSetupCompleted: true,
      username: null,
    });
  } catch (profileErr) {
    await supabase.auth.admin.deleteUser(authUserId);
    throw profileErr;
  }

  const displayName = await resolveUniqueDisplayName(supabase);

  const { error: participantErr } = await supabase.from("participants").insert({
    supplied_name:    sanitizedName,
    email:            sanitizedEmail,
    member_roster_id: null,
    user_id:          authUserId,
    display_name:     displayName,
  });

  if (participantErr) {
    console.error("[registerMember] participant insert failed:", participantErr.message);
  } else {
    const username = await resolveUniqueUsername(supabase, displayName, authUserId);
    await supabase
      .from("profiles")
      .update({ username })
      .eq("profile_id", authUserId)
      .is("username", null);
  }

  return { authUserId };
}

// ---------------------------------------------------------------------------
// FLOW 3: Complete initial password setup (pre-provisioned accounts)
// ---------------------------------------------------------------------------

export async function completeInitialSetup(
  authUserId: string,
  newPassword: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error: pwError } = await supabase.auth.admin.updateUserById(
    authUserId,
    { password: newPassword }
  );

  if (pwError) {
    throw new Error(`Password update failed: ${pwError.message}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ initial_setup_completed: true })
    .eq("profile_id", authUserId);

  if (profileError) {
    console.error(
      `[completeInitialSetup] profile update failed for ${authUserId}:`,
      profileError.message
    );
    throw new Error(
      "Password updated but account setup could not be marked complete. Please contact support."
    );
  }
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

export async function getParticipantRoles(
  authUserId: string
): Promise<ParticipantRole[]> {
  const supabase = createAdminClient();

  const { data: participant } = await supabase
    .from("participants")
    .select("participant_id")
    .eq("user_id", authUserId)
    .maybeSingle();

  if (!participant) return [];

  const { data: roles, error } = await supabase
    .from("participant_roles")
    .select("participant_id, role, granted_at, granted_by")
    .eq("participant_id", participant.participant_id);

  if (error) {
    console.error("[getParticipantRoles] query failed:", error.message);
    return [];
  }

  return (roles ?? []).map((r) => ({
    participantId: r.participant_id as string,
    role:          r.role as RoleName,
    grantedAt:     r.granted_at as string,
    grantedBy:     r.granted_by as string | null,
  }));
}

export async function hasRole(
  authUserId: string,
  role: RoleName
): Promise<boolean> {
  const roles = await getParticipantRoles(authUserId);
  return roles.some((r) => r.role === role);
}
