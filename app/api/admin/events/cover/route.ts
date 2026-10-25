import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requireAnyPermission, PERMISSIONS } from "@/src/shared/lib/rbac";
import { COVER_BUCKET } from "@/src/shared/lib/events";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * POST multipart/form-data { file } — uploads a cover image to the public
 * event-covers bucket and returns its URL. The caller then saves that URL on
 * the event via POST/PATCH /api/admin/events (cover_image_url).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requireAnyPermission(user?.id, PERMISSIONS.EVENTS_CREATE, PERMISSIONS.EVENTS_UPDATE);
  if (deny) return deny;

  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = MIME_TO_EXT[file.type];
  if (!ext)
    return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP or GIF." }, { status: 415 });

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES)
    return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 413 });

  const admin = createAdminClient();
  const path = `covers/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage.from(COVER_BUCKET).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) {
    console.error("[POST /api/admin/events/cover]", error.message);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(COVER_BUCKET).getPublicUrl(path);
  return NextResponse.json({ success: true, url: publicUrl }, { status: 201 });
}
