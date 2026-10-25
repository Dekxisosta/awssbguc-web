/**
 * src/shared/lib/account/validation.ts
 *
 * Isomorphic (no server imports): used by the signup wizard in the browser
 * for instant feedback and by the register / availability routes on the
 * server as the authority. Import this file directly, not the account index,
 * from client code.
 */

import type {
  RegisterInput,
  RegistrationField,
  RegistrationMembershipInput,
  RegistrationProfileInput,
} from "@/src/shared/types/auth";

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] as const;

export type FieldErrors = Partial<Record<RegistrationField, string>>;

// ---------------------------------------------------------------------------
// Single-field validators. Each returns null when valid.
// ---------------------------------------------------------------------------

export function validateFullName(value: string): string | null {
  const v = value.trim();
  if (!v) return "Full name is required.";
  if (v.length < 2) return "Full name must be at least 2 characters.";
  if (v.length > 120) return "Full name must be 120 characters or fewer.";
  return null;
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
  if (v.length > 255) return "Email must be 255 characters or fewer.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 72) return "Password must be 72 characters or fewer.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
  return null;
}

export function validateUsername(value: string): string | null {
  if (!/^[A-Za-z][A-Za-z0-9_]{5,23}$/.test(value))
    return "Username must be 6–24 characters, start with a letter, and contain only letters, numbers, and underscores.";
  return null;
}

export function validateDiscordId(value: string): string | null {
  // 17–19 digit snowflake, or legacy username#0000
  if (!/^\d{17,19}$/.test(value) && !/^.{2,32}#\d{4}$/.test(value))
    return "Discord ID must be a numeric snowflake (17-19 digits) or username#0000.";
  return null;
}

export function validateGithubUsername(value: string): string | null {
  if (value.length > 39) return "GitHub username must be 39 characters or fewer.";
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value)) return "Invalid GitHub username format.";
  return null;
}

export function validateBio(value: string): string | null {
  return value.length > 280 ? "Bio must be 280 characters or fewer." : null;
}

export function validateStudentNumber(value: string): string | null {
  if (!/^[A-Za-z0-9-]{4,20}$/.test(value))
    return "Student number must be 4–20 characters (letters, numbers, hyphens).";
  return null;
}

function validateShortText(label: string, value: string, max: number): string | null {
  return value.length > max ? `${label} must be ${max} characters or fewer.` : null;
}

// ---------------------------------------------------------------------------
// Skills parsing
// ---------------------------------------------------------------------------

export function parseSkills(input: string | string[] | undefined): { tags: string[]; error: string | null } {
  if (input === undefined) return { tags: [], error: null };
  const raw = Array.isArray(input) ? input : input.split(",");
  const tags = raw.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
  if (tags.length > 20) return { tags, error: "You can list at most 20 skills." };
  if (tags.some((t) => t.length > 40)) return { tags, error: "Each skill must be 40 characters or fewer." };
  return { tags, error: null };
}

// ---------------------------------------------------------------------------
// Step-level validation + normalisation
// ---------------------------------------------------------------------------

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Account step: name, email, password. */
export function validateAccountInput(input: Partial<RegisterInput>): FieldErrors {
  const errors: FieldErrors = {};
  const fullName = validateFullName(clean(input.fullName));
  const email = validateEmail(clean(input.email));
  const password = validatePassword(typeof input.password === "string" ? input.password : "");
  if (fullName) errors.fullName = fullName;
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}

export interface NormalizedProfile {
  /** Lower-cased. Present only when the user chose one. */
  username?: string;
  discordId?: string;
  githubUsername?: string;
  bio?: string;
  skills?: string[];
}

/** Profile step: every field is optional; blanks are dropped. */
export function normalizeProfileInput(
  input: RegistrationProfileInput | undefined
): { value: NormalizedProfile; errors: FieldErrors } {
  const value: NormalizedProfile = {};
  const errors: FieldErrors = {};
  if (!input) return { value, errors };

  const username = clean(input.username).toLowerCase();
  if (username) {
    const err = validateUsername(username);
    if (err) errors.username = err;
    else value.username = username;
  }

  const discordId = clean(input.discordId);
  if (discordId) {
    const err = validateDiscordId(discordId);
    if (err) errors.discordId = err;
    else value.discordId = discordId;
  }

  const githubUsername = clean(input.githubUsername);
  if (githubUsername) {
    const err = validateGithubUsername(githubUsername);
    if (err) errors.githubUsername = err;
    else value.githubUsername = githubUsername;
  }

  const bio = clean(input.bio);
  if (bio) {
    const err = validateBio(bio);
    if (err) errors.bio = err;
    else value.bio = bio;
  }

  const { tags, error } = parseSkills(input.skills);
  if (error) errors.skills = error;
  else if (tags.length > 0) value.skills = tags;

  return { value, errors };
}

export interface NormalizedMembership {
  studentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  yearLevel: string;
  program: string;
  section: string;
}

const MEMBERSHIP_REQUIRED: [keyof RegistrationMembershipInput, string][] = [
  ["studentNumber", "Student number is required."],
  ["firstName", "First name is required."],
  ["lastName", "Last name is required."],
  ["yearLevel", "Year level is required."],
  ["program", "Program is required."],
  ["section", "Section is required."],
];

/**
 * Membership step. The section is all-or-nothing:
 *   - everything blank        → value null (no membership, no errors)
 *   - anything filled in      → every required field must be valid
 * Filling it in is what makes someone a member.
 */
export function normalizeMembershipInput(
  input: Partial<RegistrationMembershipInput> | undefined
): { value: NormalizedMembership | null; errors: FieldErrors } {
  const errors: FieldErrors = {};
  if (!input) return { value: null, errors };

  const v = {
    studentNumber: clean(input.studentNumber),
    firstName: clean(input.firstName),
    middleName: clean(input.middleName),
    lastName: clean(input.lastName),
    yearLevel: clean(input.yearLevel),
    program: clean(input.program),
    section: clean(input.section),
  };

  if (!Object.values(v).some(Boolean)) return { value: null, errors };

  for (const [key, message] of MEMBERSHIP_REQUIRED) {
    if (!v[key]) errors[key] = message;
  }

  if (v.studentNumber && !errors.studentNumber) {
    const err = validateStudentNumber(v.studentNumber);
    if (err) errors.studentNumber = err;
  }
  if (v.yearLevel && !(YEAR_LEVELS as readonly string[]).includes(v.yearLevel)) {
    errors.yearLevel = "Please choose a valid year level.";
  }
  const lengths: [keyof typeof v, string, number][] = [
    ["firstName", "First name", 60],
    ["middleName", "Middle name", 60],
    ["lastName", "Last name", 60],
    ["program", "Program", 100],
    ["section", "Section", 20],
  ];
  for (const [key, label, max] of lengths) {
    const err = validateShortText(label, v[key], max);
    if (err && !errors[key]) errors[key] = err;
  }

  if (Object.keys(errors).length > 0) return { value: null, errors };

  return {
    value: {
      studentNumber: v.studentNumber,
      firstName: v.firstName,
      middleName: v.middleName || null,
      lastName: v.lastName,
      yearLevel: v.yearLevel,
      program: v.program,
      section: v.section,
    },
    errors,
  };
}
