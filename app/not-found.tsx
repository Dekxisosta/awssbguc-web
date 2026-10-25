import type { Metadata } from "next";
import { PixelNotFound } from "@/src/shared/ui/PixelNotFound";

export const metadata: Metadata = { title: "Page not found — AWSSBG-UC" };

/**
 * Site-wide 404. Also what non-admins see at /admin (proxy.ts rewrites them here),
 * so the copy must not hint that an admin area exists.
 */
export default function NotFound() {
  return (
    <main className="bg-black">
      <PixelNotFound
        title="Page not found"
        message="We couldn't find the page you were looking for. It may have moved, or the link might be wrong."
        backHref="/"
        backLabel="Back to home"
      />
    </main>
  );
}
