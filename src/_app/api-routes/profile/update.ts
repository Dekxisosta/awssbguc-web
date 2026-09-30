import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { validateDisplayName } from "@/src/shared/lib/account/service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatchResponse =
  | { success: true }
  | { success: false; error: string; field?: string };

function json(body: PatchResponse, status: number) {
  return NextResponse.json(body, { status });
}

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

function validateGithubUsername(value: string): string | null {
  if (value.length > 39) return "GitHub username must be 39 characters or fewer.";
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value))
    return "Invalid GitHub username format.";
  return null;
}

function validateDiscordId(value: string): string | null {
  // Discord IDs are 17-19 digit snowflakes, or legacy username#discriminator
  if (!/^\d{17,19}$/.test(value) && !/^.{2,32}#\d{4}$/.test(value))
    return "Discord ID must be a numeric snowflake (17-19 digits) or username#0000.";
  return null;
}

function validateEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Please enter a valid email address.";
  if (value.length > 255) return "Email must be 255 characters or fewer.";
  return null;
}

function validateSuppliedName(value: string): string | null {
  if (value.length < 2) return "Name must be at least 2 characters.";
  if (value.length > 120) return "Name must be 120 characters or fewer.";
  return null;
}

function validateDisplayNameField(value: string): string | null {
  return validateDisplayName(value);
}

// ---------------------------------------------------------------------------
// Main handler — PATCH /api/profile
// Accepts a partial body; any subset of the editable fields may be present.
// ---------------------------------------------------------------------------

interface ProfilePatchBody {
  discord_id?: unknown;
  github_username?: unknown;
  display_name?: unknown;
  supplied_name?: unknown;
  email?: unknown;
  /** Public directory opt-in toggle */
  directory_visible?: unknown;
  /** Short public bio (max 280 chars) */
  bio?: unknown;
  /** Comma-separated skill tags (client sends a single string; server splits and trims) */
  skills?: unknown;
}

export async function handleProfileUpdate(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  let body: ProfilePatchBody;
  try {
    body = (await request.json()) as ProfilePatchBody;
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const {
    discord_id,
    github_username,
    display_name,
    supplied_name,
    email,
    directory_visible,
    bio,
    skills,
  } = body;

  const hasProfileFields =
    discord_id !== undefined ||
    github_username !== undefined ||
    directory_visible !== undefined ||
    bio !== undefined ||
    skills !== undefined;

  const hasParticipantFields =
    display_name !== undefined ||
    supplied_name !== undefined;

  const hasEmailField = email !== undefined;

  if (!hasProfileFields && !hasParticipantFields && !hasEmailField)
    return json({ success: false, error: "No fields provided to update." }, 400);

  const admin = createAdminClient();

  // ── profiles table ────────────────────────────────────────────────────────
  if (hasProfileFields) {
    const profileUpdate: Record<string, string | boolean | string[] | null> = {};

    if (discord_id !== undefined) {
      if (discord_id === null || (typeof discord_id === "string" && discord_id.trim() === "")) {
        profileUpdate.discord_id = null;
      } else {
        if (typeof discord_id !== "string")
          return json({ success: false, error: "Discord ID must be a string.", field: "discord_id" }, 400);
        const trimmed = discord_id.trim();
        const err = validateDiscordId(trimmed);
        if (err) return json({ success: false, error: err, field: "discord_id" }, 400);

        const { data: clash } = await admin
          .from("profiles")
          .select("profile_id")
          .eq("discord_id", trimmed)
          .neq("profile_id", user.id)
          .maybeSingle();
        if (clash)
          return json({ success: false, error: "That Discord ID is already linked to another account.", field: "discord_id" }, 409);

        profileUpdate.discord_id = trimmed;
      }
    }

    if (github_username !== undefined) {
      if (github_username === null || (typeof github_username === "string" && github_username.trim() === "")) {
        profileUpdate.github_username = null;
      } else {
        if (typeof github_username !== "string")
          return json({ success: false, error: "GitHub username must be a string.", field: "github_username" }, 400);
        const trimmed = github_username.trim();
        const err = validateGithubUsername(trimmed);
        if (err) return json({ success: false, error: err, field: "github_username" }, 400);

        const { data: clash } = await admin
          .from("profiles")
          .select("profile_id")
          .ilike("github_username", trimmed)
          .neq("profile_id", user.id)
          .maybeSingle();
        if (clash)
          return json({ success: false, error: "That GitHub username is already linked to another account.", field: "github_username" }, 409);

        profileUpdate.github_username = trimmed;
      }
    }

    // ── directory_visible ─────────────────────────────────────────────────
    if (directory_visible !== undefined) {
      if (typeof directory_visible !== "boolean")
        return json({ success: false, error: "directory_visible must be a boolean.", field: "directory_visible" }, 400);
      profileUpdate.directory_visible = directory_visible;
    }

    // ── bio ───────────────────────────────────────────────────────────────
    if (bio !== undefined) {
      if (bio === null || (typeof bio === "string" && bio.trim() === "")) {
        profileUpdate.bio = null;
      } else {
        if (typeof bio !== "string")
          return json({ success: false, error: "Bio must be a string.", field: "bio" }, 400);
        const trimmed = bio.trim();
        if (trimmed.length > 280)
          return json({ success: false, error: "Bio must be 280 characters or fewer.", field: "bio" }, 400);
        profileUpdate.bio = trimmed;
      }
    }

    // ── skills ────────────────────────────────────────────────────────────
    if (skills !== undefined) {
      if (skills === null || (typeof skills === "string" && skills.trim() === "") || (Array.isArray(skills) && skills.length === 0)) {
        profileUpdate.skills = null;
      } else {
        // Accept either a pre-split string array or a comma-separated string
        let tags: string[];
        if (Array.isArray(skills)) {
          tags = skills.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
        } else if (typeof skills === "string") {
          tags = skills.split(",").map((s) => s.trim()).filter(Boolean);
        } else {
          return json({ success: false, error: "Skills must be an array or comma-separated string.", field: "skills" }, 400);
        }
        if (tags.length > 20)
          return json({ success: false, error: "You can list at most 20 skills.", field: "skills" }, 400);
        for (const tag of tags) {
          if (tag.length > 40)
            return json({ success: false, error: "Each skill must be 40 characters or fewer.", field: "skills" }, 400);
        }
        profileUpdate.skills = tags;
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("profile_id", user.id);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("discord"))
          return json({ success: false, error: "That Discord ID is already linked to another account.", field: "discord_id" }, 409);
        if (msg.includes("github"))
          return json({ success: false, error: "That GitHub username is already linked to another account.", field: "github_username" }, 409);
        console.error("[PATCH /api/profile] profiles update failed:", error.message);
        return json({ success: false, error: "Failed to update profile." }, 500);
      }
    }
  }

  // ── participants table ────────────────────────────────────────────────────
  if (hasParticipantFields) {
    const participantUpdate: Record<string, string> = {};

    if (display_name !== undefined) {
      if (typeof display_name !== "string" || display_name.trim() === "")
        return json({ success: false, error: "Display name must be a non-empty string.", field: "display_name" }, 400);
      const trimmed = display_name.trim();
      const err = validateDisplayNameField(trimmed);
      if (err) return json({ success: false, error: err, field: "display_name" }, 400);

      const { data: clash } = await admin
        .from("participants")
        .select("participant_id")
        .ilike("display_name", trimmed)
        .neq("user_id", user.id)
        .maybeSingle();
      if (clash)
        return json({ success: false, error: "That display name is already taken.", field: "display_name" }, 409);

      participantUpdate.display_name = trimmed;
    }

    if (supplied_name !== undefined) {
      if (typeof supplied_name !== "string" || supplied_name.trim() === "")
        return json({ success: false, error: "Name must be a non-empty string.", field: "supplied_name" }, 400);
      const trimmed = supplied_name.trim();
      const err = validateSuppliedName(trimmed);
      if (err) return json({ success: false, error: err, field: "supplied_name" }, 400);
      participantUpdate.supplied_name = trimmed;
    }

    if (Object.keys(participantUpdate).length > 0) {
      const { error } = await admin
        .from("participants")
        .update(participantUpdate)
        .eq("user_id", user.id);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("display_name"))
          return json({ success: false, error: "That display name is already taken.", field: "display_name" }, 409);
        console.error("[PATCH /api/profile] participants update failed:", error.message);
        return json({ success: false, error: "Failed to update profile." }, 500);
      }
    }
  }

  // ── auth.users email ───────────────────────────────────────────────────────
  if (hasEmailField) {
    if (typeof email !== "string" || email.trim() === "")
      return json({ success: false, error: "Email must be a non-empty string.", field: "email" }, 400);
    const trimmed = email.trim().toLowerCase();
    const err = validateEmail(trimmed);
    if (err) return json({ success: false, error: err, field: "email" }, 400);

    // Update auth.users via admin client
    const { error: authErr } = await admin.auth.admin.updateUserById(user.id, {
      email: trimmed,
    });
    if (authErr) {
      const msg = authErr.message.toLowerCase();
      const isTaken = msg.includes("already") || msg.includes("exists") || msg.includes("unique");
      return json(
        { success: false, error: isTaken ? "That email is already in use." : "Failed to update email.", field: "email" },
        isTaken ? 409 : 500
      );
    }

    // Keep participants.email in sync
    const { error: participantEmailErr } = await admin
      .from("participants")
      .update({ email: trimmed })
      .eq("user_id", user.id);
    if (participantEmailErr) {
      console.error("[PATCH /api/profile] participants email sync failed:", participantEmailErr.message);
    }
  }

  return json({ success: true }, 200);
}
