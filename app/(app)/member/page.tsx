import { redirect } from "next/navigation";
import { createClient } from "@/src/shared/supabase/server";
import { MemberPage, memberMetadata } from "@/src/_pages/member";
import type { MembershipRow } from "@/src/entities/member";

export const metadata = memberMetadata;

export default async function MemberRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participant } = await supabase
    .from("participants")
    .select("member_roster_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: membership } = participant?.member_roster_id
    ? await supabase
        .from("member_roster")
        .select(`member_id, student_number, student_data ( first_name, middle_name, last_name, year_level, program, section )`)
        .eq("member_id", participant.member_roster_id)
        .maybeSingle()
    : { data: null };

  return (
    <MemberPage
      membership={membership as MembershipRow | null}
    />
  );
}
