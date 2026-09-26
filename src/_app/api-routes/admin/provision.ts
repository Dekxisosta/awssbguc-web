import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { provisionMemberWithEmail, provisionMembersWithEmail } from "@/src/shared/lib/account/service";

function adminSecretValid(request: NextRequest): boolean {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return true;
    console.error("[provision] ADMIN_API_SECRET is not set.");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const provided = authHeader.slice("Bearer ".length);
  try {
    const secretBuf = Buffer.from(secret, "utf8");
    const providedBuf = Buffer.from(provided, "utf8");
    if (secretBuf.length !== providedBuf.length) { timingSafeEqual(secretBuf, secretBuf); return false; }
    return timingSafeEqual(secretBuf, providedBuf);
  } catch { return false; }
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidMemberId(value: unknown): value is string {
  return typeof value === "string" && /^SBG-UC-\d{6}$/.test(value);
}

export async function handleProvision(request: NextRequest) {
  if (!adminSecretValid(request))
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { memberId, email, members } = (body ?? {}) as { memberId?: unknown; email?: unknown; members?: unknown };

  if (memberId !== undefined || email !== undefined) {
    if (!isValidMemberId(memberId))
      return NextResponse.json({ error: "memberId must be a valid SBG member ID (e.g. SBG-UC-260001)." }, { status: 400 });
    if (!isValidEmail(email))
      return NextResponse.json({ error: "email must be a valid email address." }, { status: 400 });
    try {
      const result = await provisionMemberWithEmail({ memberId, email });
      return NextResponse.json({ success: true, result }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[provision] Failed for member ${memberId}:`, message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  }

  if (members !== undefined) {
    if (!Array.isArray(members) || members.length === 0)
      return NextResponse.json({ error: "members must be a non-empty array." }, { status: 400 });
    if (members.length > 100)
      return NextResponse.json({ error: "Maximum 100 members per request." }, { status: 400 });
    const invalid = members.find((m) => !isValidMemberId(m?.memberId) || !isValidEmail(m?.email));
    if (invalid)
      return NextResponse.json({ error: "Each entry must have a valid memberId and email." }, { status: 400 });
    const result = await provisionMembersWithEmail(members as Array<{ memberId: string; email: string }>);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  }

  return NextResponse.json(
    { error: "Provide either { memberId, email } (single) or { members: [...] } (bulk)." },
    { status: 400 }
  );
}
