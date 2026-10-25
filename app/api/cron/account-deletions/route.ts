import { NextRequest, NextResponse } from "next/server";
import { processScheduledAccountDeletions } from "@/src/shared/lib/account/deletion";

// Invoked daily by Vercel Cron (see vercel.json). Vercel sends
// `Authorization: Bearer ${CRON_SECRET}` when the CRON_SECRET env var is set.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/account-deletions] CRON_SECRET is not set.");
    return NextResponse.json({ success: false, error: "Not configured." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { deleted, failed } = await processScheduledAccountDeletions();
    if (failed.length > 0) {
      console.error("[cron/account-deletions] some deletions failed:", failed);
    }
    return NextResponse.json(
      { success: failed.length === 0, deletedCount: deleted.length, failed },
      { status: failed.length === 0 ? 200 : 207 }
    );
  } catch (err) {
    console.error("[cron/account-deletions] run failed:", err);
    return NextResponse.json({ success: false, error: "Run failed." }, { status: 500 });
  }
}
