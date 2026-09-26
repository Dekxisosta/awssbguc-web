import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp",
};

function json(body: object, status: number) {
  return NextResponse.json(body, { status });
}

export async function handleAvatarUpload(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: "Invalid form data." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return json({ success: false, error: "No file provided." }, 400);

  const mime = file.type;
  if (!ALLOWED_MIME.has(mime))
    return json({ success: false, error: "Unsupported file type. Upload a JPEG, PNG, GIF, or WebP image." }, 415);

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES)
    return json({ success: false, error: `File too large. Maximum size is 2 MB.` }, 413);

  const admin = createAdminClient();
  const ext = MIME_TO_EXT[mime] ?? "webp";
  const objectPath = `${user.id}/avatar.${ext}`;

  const { data: existing } = await admin.storage.from(BUCKET).list(user.id, { limit: 20 });
  if (existing && existing.length > 0) {
    const paths = existing.map((obj) => `${user.id}/${obj.name}`);
    await admin.storage.from(BUCKET).remove(paths);
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: mime,
    upsert: true,
  });
  if (uploadError) {
    console.error("[POST /api/profile/avatar] upload failed:", uploadError.message);
    return json({ success: false, error: "Failed to upload image." }, 500);
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(objectPath);
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("profile_id", user.id);
  if (updateError) {
    console.error("[POST /api/profile/avatar] profile update failed:", updateError.message);
    return json({ success: false, error: "Image uploaded but profile could not be updated." }, 500);
  }

  return json({ success: true, avatarUrl }, 200);
}

export async function handleAvatarDelete(_request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  const admin = createAdminClient();
  const { data: existing } = await admin.storage.from(BUCKET).list(user.id, { limit: 20 });
  if (existing && existing.length > 0) {
    const paths = existing.map((obj) => `${user.id}/${obj.name}`);
    const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);
    if (removeError) {
      console.error("[DELETE /api/profile/avatar] remove failed:", removeError.message);
      return json({ success: false, error: "Failed to remove image." }, 500);
    }
  }

  const { error: updateError } = await admin.from("profiles").update({ avatar_url: null }).eq("profile_id", user.id);
  if (updateError) {
    console.error("[DELETE /api/profile/avatar] profile update failed:", updateError.message);
    return json({ success: false, error: "Image removed but profile could not be updated." }, 500);
  }

  return json({ success: true }, 200);
}
