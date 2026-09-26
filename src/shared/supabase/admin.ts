import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client that uses the service-role key.
 *
 * IMPORTANT: This module must ONLY be imported in server-side code
 * (Route Handlers, Server Actions, or server utilities). It must
 * never be imported in Client Components or any file that is
 * bundled for the browser.
 *
 * The service-role key bypasses Row-Level Security, which is
 * intentional for privileged operations like:
 *   - Creating auth users during registration
 *   - Inserting the initial profile record
 *   - Future Discord account binding via an authenticated API
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Ensure both are set in your server environment and never exposed to the browser."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Prevent the admin client from persisting any session in storage.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
