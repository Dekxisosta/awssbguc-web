import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/src/shared/lib/rbac";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface AuditRow {
  id: string;
  created_at: string;
  action: string;
  outcome: "success" | "denied" | "failed";
  via: "session" | "api_secret" | "system";
  actor_label: string | null;
  target_label: string | null;
  details: Record<string, unknown> | null;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const deny = await requirePermission(user?.id, PERMISSIONS.AUDIT_READ);
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const filter = sp.get("filter") ?? "all";
  // Strip characters that have meaning inside a PostgREST filter expression.
  const q = (sp.get("q") ?? "").replace(/[%,()*_\\"']/g, " ").trim().slice(0, 100);

  const from = (page - 1) * PAGE_SIZE;
  const admin = createAdminClient();

  let query = admin
    .from("audit_log")
    .select("id, created_at, action, outcome, via, actor_label, target_label, details", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (filter === "passwords") query = query.like("action", "password.%");
  else if (filter === "accounts") query = query.like("action", "account.%");
  else if (filter === "roles") query = query.like("action", "role.%");
  else if (filter === "problems") query = query.neq("outcome", "success");

  if (q) query = query.or(`actor_label.ilike.%${q}%,target_label.ilike.%${q}%,action.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error) {
    console.error("[audit] list failed:", error.message);
    return NextResponse.json({ error: "Failed to load the audit log." }, { status: 500 });
  }

  const total = count ?? 0;
  return NextResponse.json({
    entries: ((data ?? []) as AuditRow[]).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      action: r.action,
      outcome: r.outcome,
      via: r.via,
      actorLabel: r.actor_label,
      targetLabel: r.target_label,
      details: r.details ?? {},
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
