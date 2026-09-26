import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
