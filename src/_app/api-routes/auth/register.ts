import { NextRequest, NextResponse } from "next/server";
import { RegistrationError, registerAccount } from "@/src/shared/lib/account/service";
import {
  normalizeMembershipInput,
  normalizeProfileInput,
  validateAccountInput,
  type FieldErrors,
} from "@/src/shared/lib/account/validation";
import type { RegisterResponse, RegistrationPayload } from "@/src/shared/types/auth";

function json(body: RegisterResponse, status: number) {
  return NextResponse.json(body, { status });
}

function validationFailure(errors: FieldErrors) {
  const [field, error] = Object.entries(errors)[0] as [keyof FieldErrors, string];
  return json({ success: false, error, field, errors }, 400);
}

/**
 * POST /api/auth/register
 *
 * Called once, at the end of the signup wizard. Nothing is created before this.
 * Body: { email, fullName, password, profile?, membership? }
 */
export async function handleRegister(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const payload = (body ?? {}) as Partial<RegistrationPayload>;

  const errors: FieldErrors = { ...validateAccountInput(payload) };

  const profile = normalizeProfileInput(payload.profile);
  Object.assign(errors, profile.errors);

  const membership = normalizeMembershipInput(payload.membership);
  Object.assign(errors, membership.errors);

  if (Object.keys(errors).length > 0) return validationFailure(errors);

  try {
    const result = await registerAccount({
      email: payload.email as string,
      fullName: payload.fullName as string,
      password: payload.password as string,
      profile: profile.value,
      membership: membership.value,
    });

    return json(
      { success: true, message: "Account created.", membership: result.membership },
      201
    );
  } catch (err) {
    if (err instanceof RegistrationError && err.code === "field_taken") {
      return json(
        {
          success: false,
          error: err.message,
          field: err.field,
          errors: err.field ? { [err.field]: err.message } : undefined,
        },
        409
      );
    }
    console.error("[register] Registration failed:", err instanceof Error ? err.message : err);
    return json({ success: false, error: "Registration failed. Please try again later." }, 500);
  }
}
