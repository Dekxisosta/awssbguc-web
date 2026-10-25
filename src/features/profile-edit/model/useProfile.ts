"use client";

import { useState } from "react";

type PatchResponse =
  | { success: true }
  | { success: false; error: string; field?: string };

type DeleteResponse =
  | { success: true; scheduledAt?: string }
  | { success: false; error: string };

const GENERIC_ERROR = "Something went wrong. Please try again.";

export interface ProfileData {
  username: string | null;
  displayName: string | null;
  fullName: string;
  email: string;
  githubUsername: string | null;
  avatarUrl: string | null;
  directoryVisible: boolean;
  bio: string | null;
  skills: string[] | null;
  /** ISO timestamp, set when the user has requested account deletion */
  deletionScheduledAt: string | null;
}

/** PATCH /api/profile. Resolves to an error message, or null on success. */
async function patchProfile(payload: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: PatchResponse = await res.json();
    return data.success ? null : data.error;
  } catch {
    return GENERIC_ERROR;
  }
}

/**
 * Owns the editable profile values and the calls that persist them.
 * Every `save.*` function resolves to an error message (or null) so it can be handed straight to
 * `EditableField`, and updates local state only after the server accepted the change.
 */
export function useProfile(initial: ProfileData) {
  const [profile, setProfile] = useState<ProfileData>(initial);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const save = {
    async username(value: string) {
      const err = await patchProfile({ username: value });
      if (!err) update("username", value);
      return err;
    },
    async displayName(value: string) {
      const err = await patchProfile({ display_name: value });
      if (!err) update("displayName", value);
      return err;
    },
    async fullName(value: string) {
      const err = await patchProfile({ supplied_name: value });
      if (!err) update("fullName", value);
      return err;
    },
    async email(value: string) {
      const err = await patchProfile({ email: value });
      if (!err) update("email", value);
      return err;
    },
    async githubUsername(value: string) {
      const err = await patchProfile({ github_username: value || null });
      if (!err) update("githubUsername", value || null);
      return err;
    },
    async directoryVisible(value: boolean) {
      const err = await patchProfile({ directory_visible: value });
      if (!err) update("directoryVisible", value);
      return err;
    },
    async bio(value: string) {
      const err = await patchProfile({ bio: value || null });
      if (!err) update("bio", value || null);
      return err;
    },
    async skills(value: string) {
      const tags = value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
      const err = await patchProfile({ skills: tags.length > 0 ? tags : null });
      if (!err) update("skills", tags.length > 0 ? tags : null);
      return err;
    },
  };

  const setAvatarUrl = (url: string | null) => update("avatarUrl", url);

  async function requestDeletion(): Promise<string | null> {
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data: DeleteResponse = await res.json();
      if (!data.success) return data.error;
      update("deletionScheduledAt", data.scheduledAt ?? null);
      return null;
    } catch {
      return GENERIC_ERROR;
    }
  }

  async function cancelDeletion(): Promise<string | null> {
    try {
      const res = await fetch("/api/account/cancel-deletion", { method: "POST" });
      const data: DeleteResponse = await res.json();
      if (!data.success) return data.error;
      update("deletionScheduledAt", null);
      return null;
    } catch {
      return GENERIC_ERROR;
    }
  }

  return { profile, save, setAvatarUrl, requestDeletion, cancelDeletion };
}

export type ProfileApi = ReturnType<typeof useProfile>;
