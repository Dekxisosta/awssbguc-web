import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { LoginResponse } from "@/src/shared/types/auth";

export async function handleLogin(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<LoginResponse>({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !email.trim())
    return NextResponse.json<LoginResponse>({ success: false, error: "email is required." }, { status: 400 });
  if (typeof password !== "string" || !password)
    return NextResponse.json<LoginResponse>({ success: false, error: "password is required." }, { status: 400 });

  const response = NextResponse.json<LoginResponse>({ success: true, requiresSetup: false }, { status: 200 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { response.cookies.set({ name, value, ...options }); },
        remove(name: string, options: CookieOptions) { response.cookies.set({ name, value: "", ...options }); },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user)
    return NextResponse.json<LoginResponse>({ success: false, error: "Invalid email or password." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("initial_setup_completed")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  const requiresSetup = profile?.initial_setup_completed === false;

  const finalResponse = NextResponse.json<LoginResponse>({ success: true, requiresSetup }, { status: 200 });
  response.cookies.getAll().forEach(({ name, value, ...opts }) => {
    finalResponse.cookies.set({ name, value, ...opts });
  });
  return finalResponse;
}
