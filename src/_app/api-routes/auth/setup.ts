import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { completeInitialSetup, validatePassword } from "@/src/shared/lib/account/service";
import type { SetupResponse } from "@/src/shared/types/auth";

function json(body: SetupResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function handleSetup(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user)
    return json({ success: false, error: "You must be signed in to complete setup." }, 401);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("initial_setup_completed")
    .eq("profile_id", user.id)
    .single();

  if (profileError || !profile)
    return json({ success: false, error: "Account profile not found." }, 404);
  if (profile.initial_setup_completed)
    return json({ success: false, error: "Account setup is already complete." }, 409);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const { password, confirmPassword } = (body ?? {}) as { password?: unknown; confirmPassword?: unknown };

  if (!password || typeof password !== "string")
    return json({ success: false, error: "Password is required.", field: "password" }, 400);
  if (!confirmPassword || typeof confirmPassword !== "string")
    return json({ success: false, error: "Please confirm your password.", field: "confirmPassword" }, 400);
  if (password !== confirmPassword)
    return json({ success: false, error: "Passwords do not match.", field: "confirmPassword" }, 400);

  const passwordError = validatePassword(password);
  if (passwordError)
    return json({ success: false, error: passwordError, field: "password" }, 400);

  try {
    await completeInitialSetup(user.id, password);
    return json({ success: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Setup failed.";
    console.error("[setup] completeInitialSetup failed:", message);
    return json({ success: false, error: message }, 500);
  }
}
