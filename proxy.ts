import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes that require an authenticated session.
 * Unauthenticated visitors are redirected to /login.
 * Note: / (root) is intentionally excluded — it is publicly accessible.
 * Auth-gating within the shell is handled at the UI component level.
 */
const PROTECTED_PREFIXES = ["/setup", "/admin"];

/**
 * Routes that require the 'admin' role.
 * Authenticated users without the role receive a 403.
 */
const ADMIN_PREFIXES = ["/admin"];

/**
 * Routes that authenticated users with a complete account should not visit.
 * They are redirected to / instead.
 */
const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

/**
 * Machine-to-machine routes (Vercel Cron). These bypass user-session logic
 * entirely and are only reachable with `Authorization: Bearer ${CRON_SECRET}`.
 */
const CRON_PREFIXES = ["/api/cron/"];

/**
 * True for /members/<username> when <username> is the signed-in user's own. Handled here, before anything
 * renders, so the owner never sees a flash of the public page on the way to /profile.
 */
function isOwnMemberPath(pathname: string, ownUsername: string | null): boolean {
  if (!ownUsername) return false;
  const m = pathname.match(/^\/members\/([^/]+)\/?$/);
  if (!m) return false;
  try {
    return decodeURIComponent(m[1]).toLowerCase() === ownUsername.toLowerCase();
  } catch {
    return false;
  }
}

/** Constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  // --- Cron routes: shared-secret check, no session handling ---
  if (CRON_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Not configured." }, { status: 500 });
    }
    const provided = request.headers.get("authorization") ?? "";
    if (!safeEqual(provided, `Bearer ${secret}`)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Always refresh the session cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // --- Unauthenticated access to protected routes ---
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Authenticated users: enforce setup gate and role checks ---
  if (user) {
    // Check initial_setup_completed using the anon client.
    // The "profiles: owner select" RLS policy allows this.
    const { data: profile } = await supabase
      .from("profiles")
      .select("initial_setup_completed, username")
      .eq("profile_id", user.id)
      .single();

    const setupComplete = profile?.initial_setup_completed ?? true;
    const ownUsername = (profile?.username as string | null | undefined) ?? null;

    // If setup is not complete, the only allowed destination is /setup.
    if (
      !setupComplete &&
      !pathname.startsWith("/setup") &&
      !pathname.startsWith("/api/auth/setup") &&
      !pathname.startsWith("/api/auth/logout")
    ) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }

    if (setupComplete) {
      // --- Your own public member page is /profile ---
      if (isOwnMemberPath(pathname, ownUsername)) {
        return NextResponse.redirect(new URL("/profile", request.url));
      }

      // --- Admin role guard ---
      const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
      if (isAdminRoute) {
        // Resolve the participant's roles via the anon client.
        // The "participant_roles: owner can read own roles" RLS policy covers this.
        const { data: participant } = await supabase
          .from("participants")
          .select("participant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        let isAdmin = false;
        if (participant) {
          const { data: roleRow } = await supabase
            .from("participant_roles")
            .select("role")
            .eq("participant_id", participant.participant_id)
            .eq("role", "admin")
            .maybeSingle();
          isAdmin = roleRow !== null;
        }

        if (!isAdmin) {
          // Render the 404 page at the same URL so /admin looks like it doesn't exist.
          return NextResponse.rewrite(new URL("/404", request.url));
        }
      }

      // Redirect away from auth-only pages.
      const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
      if (isAuthOnly) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      // Also redirect away from /setup if already complete.
      if (pathname.startsWith("/setup")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
