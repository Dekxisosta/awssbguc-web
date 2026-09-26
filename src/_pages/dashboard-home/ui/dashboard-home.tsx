import { createAdminClient } from "@/src/shared/supabase/admin";
import { HomeClient } from "@/src/widgets/home-client";

export const dashboardHomeMetadata = { title: "Home — AWSSBG-UC" };

export async function DashboardHomePage() {
  const supabase = createAdminClient();

  const [{ count: registeredCount }, { count: participantCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("participants")
        .select("*", { count: "exact", head: true }),
    ]);

  return (
    <HomeClient
      registeredCount={registeredCount ?? 0}
      participantCount={participantCount ?? 0}
    />
  );
}
