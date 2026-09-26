import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";

export async function handleLogout(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 302 });
}
