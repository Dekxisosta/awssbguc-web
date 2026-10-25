import { NextRequest, NextResponse } from "next/server";
import { getTakenFields, type AvailabilityInput } from "@/src/shared/lib/account/service";
import {
  validateDiscordId,
  validateEmail,
  validateGithubUsername,
  validateStudentNumber,
  validateUsername,
} from "@/src/shared/lib/account/validation";
import type { AvailabilityResponse } from "@/src/shared/types/auth";

function json(body: AvailabilityResponse, status: number) {
  return NextResponse.json(body, { status });
}

// Best-effort, per-instance limiter. On serverless this only slows a single
// warm instance down; it is not a substitute for edge / WAF rate limiting.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) {
    for (const [k, v] of Array.from(hits)) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > MAX_REQUESTS;
}

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v === "" || v.length > 255 ? undefined : v;
}

/**
 * POST /api/auth/check-availability
 *
 * Used by the signup wizard to flag values that are already taken. Creates and
 * changes nothing. Values that fail format validation are not looked up (the
 * client already reports those), so this only answers "is it taken?".
 */
export async function handleCheckAvailability(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return json({ success: false, error: "Too many requests. Please slow down." }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = ((await request.json()) ?? {}) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const input: AvailabilityInput = {};

  const email = str(body.email);
  if (email && !validateEmail(email)) input.email = email.toLowerCase();

  const username = str(body.username)?.toLowerCase();
  if (username && !validateUsername(username)) input.username = username;

  const discordId = str(body.discordId);
  if (discordId && !validateDiscordId(discordId)) input.discordId = discordId;

  const githubUsername = str(body.githubUsername);
  if (githubUsername && !validateGithubUsername(githubUsername)) input.githubUsername = githubUsername;

  const studentNumber = str(body.studentNumber);
  if (studentNumber && !validateStudentNumber(studentNumber)) input.studentNumber = studentNumber;

  if (Object.keys(input).length === 0) return json({ success: true, taken: [] }, 200);

  try {
    return json({ success: true, taken: await getTakenFields(input) }, 200);
  } catch (err) {
    console.error("[check-availability] failed:", err instanceof Error ? err.message : err);
    return json({ success: false, error: "Could not check availability." }, 500);
  }
}
