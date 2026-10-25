import type { AvailabilityResponse, RegistrationField } from "@/src/shared/types/auth";

export type AvailabilityQuery = Partial<Record<
  "email" | "username" | "discordId" | "githubUsername" | "studentNumber",
  string
>>;

/**
 * Ask the server which of these values are already in use.
 * Returns null when the check could not be completed (network error, rate
 * limit). Callers should let the user continue in that case: the register
 * endpoint re-checks authoritatively.
 */
export async function checkAvailability(query: AvailabilityQuery): Promise<RegistrationField[] | null> {
  const body: AvailabilityQuery = {};
  for (const [k, v] of Object.entries(query)) {
    if (typeof v === "string" && v.trim()) body[k as keyof AvailabilityQuery] = v.trim();
  }
  if (Object.keys(body).length === 0) return [];

  try {
    const res = await fetch("/api/auth/check-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: AvailabilityResponse = await res.json();
    return data.success ? data.taken : null;
  } catch {
    return null;
  }
}
