import type { RegistrationField } from "@/src/shared/types/auth";

export const STEPS = ["account", "profile", "membership", "review"] as const;
export type WizardStep = (typeof STEPS)[number];

export const STEP_LABELS: Record<WizardStep, string> = {
  account: "Account",
  profile: "Profile",
  membership: "Membership",
  review: "Review",
};

export interface WizardData {
  // Account (required)
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Profile (optional)
  avatar: File | null;
  username: string;
  discordId: string;
  githubUsername: string;
  bio: string;
  skills: string;
  // Membership (optional, all-or-nothing)
  studentNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  yearLevel: string;
  program: string;
  section: string;
  // Review
  agreedToTerms: boolean;
}

export const EMPTY_DATA: WizardData = {
  fullName: "", email: "", password: "", confirmPassword: "",
  avatar: null, username: "", discordId: "", githubUsername: "", bio: "", skills: "",
  studentNumber: "", firstName: "", middleName: "", lastName: "", yearLevel: "", program: "", section: "",
  agreedToTerms: false,
};

/** Anything a wizard field error can be attached to. */
export type WizardField = RegistrationField | "confirmPassword" | "avatar" | "terms";
export type WizardErrors = Partial<Record<WizardField, string>>;

/** Fields that must be unique, and the step each one lives on. */
export const UNIQUE_FIELDS_BY_STEP: Record<WizardStep, RegistrationField[]> = {
  account: ["email"],
  profile: ["username", "discordId", "githubUsername"],
  membership: ["studentNumber"],
  review: [],
};

export const FIELD_STEP: Partial<Record<WizardField, WizardStep>> = {
  fullName: "account", email: "account", password: "account", confirmPassword: "account",
  avatar: "profile", username: "profile", discordId: "profile", githubUsername: "profile", bio: "profile", skills: "profile",
  studentNumber: "membership", firstName: "membership", middleName: "membership", lastName: "membership",
  yearLevel: "membership", program: "membership", section: "membership",
  terms: "review",
};

export const TAKEN_MESSAGES: Partial<Record<RegistrationField, string>> = {
  email: "That email is already registered. Sign in instead, or use a different email.",
  username: "That username is already taken.",
  discordId: "That Discord ID is already linked to another account.",
  githubUsername: "That GitHub username is already linked to another account.",
  studentNumber: "That student number already has an SBG membership. If this is you, contact an administrator.",
};
