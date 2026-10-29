import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { loadOwnStudentRecord } from "@/src/shared/lib/student-data/service";
import { MemberPage, memberMetadata } from "@/src/_pages/member";
import type { MembershipRow } from "@/src/entities/member";
import type { ChangeRequest } from "@/src/entities/student-data";

export const metadata = memberMetadata;
export const dynamic = "force-dynamic";

export default async function MemberRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // student_data has no client-readable RLS policy, so it's loaded server-side
  // (service role), keyed strictly by the signed-in user's id.
  const record = await loadOwnStudentRecord(user.id);

  const membership: MembershipRow | null = record
    ? {
        member_id: record.memberId,
        student_number: record.studentNumber,
        student_data: record.values,
      }
    : null;

  // Requests are read with the user's own client: RLS limits it to their rows.
  const { data: requests } = record
    ? await supabase
        .from("student_data_change_requests")
        .select("request_id, student_number, current_values, requested_values, reason, status, review_note, reviewed_at, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null };

  return (
    <MemberPage
      membership={membership}
      extras={record?.extras ?? null}
      requests={(requests ?? []) as ChangeRequest[]}
    />
  );
}
