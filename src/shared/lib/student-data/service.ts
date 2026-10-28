/**
 * src/shared/lib/student-data/service.ts
 *
 * Server-only. Loads the signed-in participant's own student record.
 *
 * student_data has RLS enabled with no client policies (service-role only), so
 * the browser/anon client can never read it. This goes through the admin
 * client instead, and is keyed strictly by the authenticated user's id: the
 * caller passes `user.id` from supabase.auth.getUser(), never a value taken
 * from the request body or URL.
 */

import { createAdminClient } from "@/src/shared/supabase/admin";
import type { StudentExtras, StudentValues } from "@/src/entities/student-data";

export interface OwnStudentRecord {
  participantId: string;
  memberId: string;
  studentNumber: string;
  values: StudentValues;
  extras: StudentExtras;
}

const COLS =
  "student_number, first_name, middle_name, last_name, year_level, program, section, contact_number, email, date_of_birth";

/**
 * Returns null when the user has no participant row or no linked membership
 * (nothing to show or change yet).
 */
export async function loadOwnStudentRecord(authUserId: string): Promise<OwnStudentRecord | null> {
  const admin = createAdminClient();

  const { data: participant, error: pErr } = await admin
    .from("participants")
    .select("participant_id, member_roster_id")
    .eq("user_id", authUserId)
    .maybeSingle();
  if (pErr) throw new Error(`participant lookup failed: ${pErr.message}`);
  if (!participant?.member_roster_id) return null;

  const { data: roster, error: rErr } = await admin
    .from("member_roster")
    .select("member_id, student_number")
    .eq("member_id", participant.member_roster_id)
    .maybeSingle();
  if (rErr) throw new Error(`member_roster lookup failed: ${rErr.message}`);
  if (!roster) return null;

  const { data: sd, error: sErr } = await admin
    .from("student_data")
    .select(COLS)
    .eq("student_number", roster.student_number)
    .maybeSingle();
  if (sErr) throw new Error(`student_data lookup failed: ${sErr.message}`);
  if (!sd) return null;

  return {
    participantId: participant.participant_id,
    memberId: roster.member_id,
    studentNumber: roster.student_number,
    values: {
      first_name: sd.first_name ?? null,
      middle_name: sd.middle_name ?? null,
      last_name: sd.last_name ?? null,
      year_level: sd.year_level ?? null,
      program: sd.program ?? null,
      section: sd.section ?? null,
    },
    extras: {
      contact_number: sd.contact_number ?? null,
      email: sd.email ?? null,
      date_of_birth: sd.date_of_birth ?? null,
    },
  };
}
