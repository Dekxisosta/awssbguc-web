import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

function json(body: object, status: number) {
  return NextResponse.json(body, { status });
}

type Field = "studentNumber" | "firstName" | "lastName" | "yearLevel" | "program" | "section";

function requireString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function handleMemberLink(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  const studentNumber = requireString(raw.studentNumber);
  const firstName = requireString(raw.firstName);
  const middleName = requireString(raw.middleName); // optional — null is fine
  const lastName = requireString(raw.lastName);
  const yearLevel = requireString(raw.yearLevel);
  const program = requireString(raw.program);
  const section = requireString(raw.section);

  const required: [Field, string | null][] = [
    ["studentNumber", studentNumber],
    ["firstName", firstName],
    ["lastName", lastName],
    ["yearLevel", yearLevel],
    ["program", program],
    ["section", section],
  ];
  const missing = required.find(([, value]) => value === null);
  if (missing) {
    const labels: Record<Field, string> = {
      studentNumber: "Student number is required.",
      firstName: "First name is required.",
      lastName: "Last name is required.",
      yearLevel: "Year level is required.",
      program: "Program is required.",
      section: "Section is required.",
    };
    return json({ success: false, error: labels[missing[0]], field: missing[0] }, 400);
  }

  const admin = createAdminClient();

  // A participants row already exists for every authenticated account
  // (created at signup or provisioning) — find this user's own row.
  const { data: ownParticipant, error: participantLookupErr } = await admin
    .from("participants")
    .select("participant_id, member_roster_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (participantLookupErr) {
    console.error("[POST /api/member/link] participant lookup failed:", participantLookupErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }

  if (!ownParticipant) {
    return json({ success: false, error: "No participant record found for your account. Please contact an administrator." }, 404);
  }

  if (ownParticipant.member_roster_id) {
    return json({ success: false, error: `Your account is already linked to member ${ownParticipant.member_roster_id}.` }, 409);
  }

  const { data: registered, error: registerErr } = await admin
    .rpc("register_member_self_reported", {
      p_student_number: studentNumber,
      p_first_name: firstName,
      p_middle_name: middleName,
      p_last_name: lastName,
      p_year_level: yearLevel,
      p_program: program,
      p_section: section,
    })
    .maybeSingle() as { data: { member_id: string; student_number: string } | null; error: { code?: string; message: string } | null };

  if (registerErr) {
    if (registerErr.code === "23505" || registerErr.message.toLowerCase().includes("already has an active")) {
      return json({
        success: false,
        error: "That student number already has an active SBG membership. If this is you, contact an administrator.",
        field: "studentNumber",
      }, 409);
    }
    console.error("[POST /api/member/link] register_member_self_reported failed:", registerErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }

  if (!registered) {
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }

  const { error: linkErr } = await admin
    .from("participants")
    .update({ member_roster_id: registered.member_id })
    .eq("participant_id", ownParticipant.participant_id)
    .is("member_roster_id", null);

  if (linkErr) {
    console.error("[POST /api/member/link] participants update failed:", linkErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }

  return json({ success: true, memberId: registered.member_id }, 200);
}
