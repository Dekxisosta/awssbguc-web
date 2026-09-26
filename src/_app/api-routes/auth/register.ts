import { NextRequest, NextResponse } from "next/server";
import { registerMember, validatePassword } from "@/src/shared/lib/account/service";
import type { RegisterInput, RegisterResponse } from "@/src/shared/types/auth";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function json(body: RegisterResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function handleRegister(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const { email, fullName, password } = (body ?? {}) as Partial<RegisterInput>;

  if (!email || typeof email !== "string" || email.trim() === "")
    return json({ success: false, error: "Email is required.", field: "email" }, 400);
  if (!isValidEmail(email.trim()))
    return json({ success: false, error: "Please enter a valid email address.", field: "email" }, 400);
  if (!fullName || typeof fullName !== "string" || fullName.trim() === "")
    return json({ success: false, error: "Full name is required.", field: "fullName" }, 400);
  if (fullName.trim().length < 2)
    return json({ success: false, error: "Full name must be at least 2 characters.", field: "fullName" }, 400);
  if (fullName.trim().length > 120)
    return json({ success: false, error: "Full name must be 120 characters or fewer.", field: "fullName" }, 400);
  if (!password || typeof password !== "string")
    return json({ success: false, error: "Password is required.", field: "password" }, 400);

  const passwordError = validatePassword(password);
  if (passwordError)
    return json({ success: false, error: passwordError, field: "password" }, 400);

  try {
    await registerMember({
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      password,
    });
    return json({ success: true, message: "Account created. You can now sign in." }, 201);
  } catch (err) {
    const error = err as Error & { code?: string; field?: keyof RegisterInput };
    if (error.code === "email_taken")
      return json({ success: false, error: error.message, field: "email" }, 409);
    console.error("[register] Registration failed:", error.message);
    return json({ success: false, error: "Registration failed. Please try again later." }, 500);
  }
}
