import {
  normalizeMembershipInput,
  normalizeProfileInput,
  validateAccountInput,
  validateDiscordId,
  validateEmail,
  validateGithubUsername,
  validateStudentNumber,
  validateUsername,
} from "@/src/shared/lib/account/validation";
import type { RegistrationField } from "@/src/shared/types/auth";
import type { AvailabilityQuery } from "./checkAvailability";
import type { WizardData, WizardErrors, WizardStep } from "./types";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function validateAvatar(file: File | null): string | null {
  if (!file) return null;
  if (!AVATAR_MIME.includes(file.type)) return "Use a JPEG, PNG, GIF, or WebP image.";
  if (file.size > AVATAR_MAX_BYTES) return "Image must be 2 MB or smaller.";
  return null;
}

export function profileInput(d: WizardData) {
  return {
    username: d.username,
    discordId: d.discordId,
    githubUsername: d.githubUsername,
    bio: d.bio,
    skills: d.skills,
    directoryVisible: d.directoryVisible,
  };
}

export function membershipInput(d: WizardData) {
  return {
    studentNumber: d.studentNumber,
    firstName: d.firstName,
    middleName: d.middleName,
    lastName: d.lastName,
    yearLevel: d.yearLevel,
    program: d.program,
    section: d.section,
  };
}

/** Local (no network) validation of one step. Empty object means the step is valid. */
export function validateStep(step: WizardStep, d: WizardData): WizardErrors {
  switch (step) {
    case "account": {
      const errors: WizardErrors = validateAccountInput({
        fullName: d.fullName,
        email: d.email,
        password: d.password,
      });
      if (!d.confirmPassword) errors.confirmPassword = "Please confirm your password.";
      else if (d.password && d.password !== d.confirmPassword) errors.confirmPassword = "Passwords do not match.";
      return errors;
    }
    case "profile": {
      const errors: WizardErrors = { ...normalizeProfileInput(profileInput(d)).errors };
      const avatarErr = validateAvatar(d.avatar);
      if (avatarErr) errors.avatar = avatarErr;
      return errors;
    }
    case "membership":
      return { ...normalizeMembershipInput(membershipInput(d)).errors };
    case "review":
      return d.agreedToTerms ? {} : { terms: "You must agree to the Terms of Service." };
  }
}

/** Values on this step that must be unique. Blank values are omitted by the caller. */
export function availabilityQueryFor(step: WizardStep, d: WizardData): AvailabilityQuery {
  switch (step) {
    case "account":
      return { email: d.email.trim().toLowerCase() };
    case "profile":
      return {
        username: d.username.trim().toLowerCase(),
        discordId: d.discordId.trim(),
        githubUsername: d.githubUsername.trim(),
      };
    case "membership":
      return { studentNumber: d.studentNumber.trim() };
    case "review":
      return {};
  }
}

type UniqueField = Extract<RegistrationField, "email" | "username" | "discordId" | "githubUsername" | "studentNumber">;

/** Current normalised value of a unique field, or "" when blank / not yet valid. */
export function uniqueFieldValue(field: UniqueField, d: WizardData): string {
  switch (field) {
    case "email": {
      const v = d.email.trim().toLowerCase();
      return v && !validateEmail(v) ? v : "";
    }
    case "username": {
      const v = d.username.trim().toLowerCase();
      return v && !validateUsername(v) ? v : "";
    }
    case "discordId": {
      const v = d.discordId.trim();
      return v && !validateDiscordId(v) ? v : "";
    }
    case "githubUsername": {
      const v = d.githubUsername.trim();
      return v && !validateGithubUsername(v) ? v : "";
    }
    case "studentNumber": {
      const v = d.studentNumber.trim();
      return v && !validateStudentNumber(v) ? v : "";
    }
  }
}
