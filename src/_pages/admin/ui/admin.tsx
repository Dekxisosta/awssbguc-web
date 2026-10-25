"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, ShieldCheck, CalendarDays, LayoutDashboard,
  UserCog, Megaphone, Plus, Search, ChevronLeft,
  ChevronRight, RefreshCw, Check, X, AlertTriangle,
  BadgeCheck, Clock, CircleMinus, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  participantCount: number;
  memberCount: number;
  accountCount: number;
  eventCount: number;
  registrationCount: number;
}

interface MemberRow {
  participant_id: string;
  display_name: string;
  supplied_name: string;
  email: string | null;
  status: string;
  member_roster_id: string | null;
  user_id: string | null;
  participant_roles: { role: string; granted_at: string }[];
  profiles: { username: string | null; avatar_url: string | null; initial_setup_completed: boolean } | null;
}

interface EventRow {
  event_id: string;
  name: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  status: "not_started" | "ongoing" | "completed" | "cancelled";
  registrations: { registered: number; attended: number; not_attended: number };
}

type Tab = "overview" | "members" | "events" | "provision" | "roles";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtDateTimeLocal(iso: string) {
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM" for datetime-local input
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "text-neutral-400 border-neutral-700 bg-neutral-800/50",
  ongoing:     "text-[#00e482] border-[#00e482]/30 bg-[#00e482]/10",
  completed:   "text-blue-400 border-blue-800/40 bg-blue-950/30",
  cancelled:   "text-red-400 border-red-800/40 bg-red-950/30",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  ongoing:     "Ongoing",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

const ROLE_COLORS: Record<string, string> = {
  admin:   "text-amber-400 border-amber-700/40 bg-amber-950/30",
  officer: "text-violet-400 border-violet-700/40 bg-violet-950/30",
  member:  "text-neutral-400 border-neutral-700 bg-neutral-800/50",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | null; color: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-neutral-100">
          {value === null ? "—" : value.toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className={`fixed bottom-6 right-6 z-[99999] flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-2xl ${type === "success" ? "border-[#00e482]/30 bg-neutral-900 text-[#00e482]" : "border-red-800/40 bg-neutral-900 text-red-400"}`}>
      {type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
      {message}
      <button type="button" onClick={onDismiss} className="ml-1 opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colorClass}`}>
      {text}
    </span>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold tracking-tight text-neutral-100">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

function inputCls(err?: boolean) {
  return [
    "w-full rounded-lg border bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100",
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 transition-colors",
    err ? "border-red-700 focus:ring-red-600/30" : "border-neutral-700 focus:ring-[#00e482]/20",
  ].join(" ");
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <SectionHeader title="Overview" sub="Platform-wide counts at a glance." />
        <button type="button" onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300 disabled:opacity-40">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Users}         label="Participants"   value={stats?.participantCount  ?? null} color="bg-neutral-800 text-neutral-400" />
        <StatCard icon={BadgeCheck}    label="Members"        value={stats?.memberCount       ?? null} color="bg-[#00e482]/10 text-[#00e482]" />
        <StatCard icon={ShieldCheck}   label="Accounts"       value={stats?.accountCount      ?? null} color="bg-blue-950/50 text-blue-400" />
        <StatCard icon={CalendarDays}  label="Events"         value={stats?.eventCount        ?? null} color="bg-violet-950/50 text-violet-400" />
        <StatCard icon={Megaphone}     label="Registrations"  value={stats?.registrationCount ?? null} color="bg-amber-950/50 text-amber-400" />
      </div>
    </div>
  );
}

// ─── Tab: Members ─────────────────────────────────────────────────────────────

function MembersTab({ callerParticipantId }: { callerParticipantId: string }) {
  const [members, setMembers]     = useState<MemberRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 350);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) params.set("q", debouncedSearch);
    const res = await fetch(`/api/admin/members?${params}`);
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    }
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  async function toggleRole(participantId: string, role: string, hasRole: boolean) {
    const method = hasRole ? "DELETE" : "POST";
    const res = await fetch("/api/admin/roles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToast({ message: data.error ?? "Failed to update role", type: "error" });
      return;
    }
    setToast({ message: `Role ${hasRole ? "revoked" : "granted"}: ${role}`, type: "success" });
    load();
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader title="Members & Participants" sub={`${total.toLocaleString()} total`} />
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name, email, ID…"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2 pl-8 pr-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#00e482]/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              {["Participant", "Member ID", "Account", "Status", "Roles", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-12 text-center text-neutral-600"><Loader2 size={20} className="mx-auto animate-spin" /></td></tr>
            )}
            {!loading && members.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-neutral-600">No results</td></tr>
            )}
            {!loading && members.map((m) => {
              const roles = m.participant_roles.map((r) => r.role);
              const handle = m.profiles?.username ?? m.display_name;
              return (
                <tr key={m.participant_id} className="border-b border-neutral-800/60 transition-colors hover:bg-neutral-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-100 truncate max-w-[160px]">{handle}</p>
                    <p className="text-[11px] text-neutral-600 truncate max-w-[160px]">{m.email ?? m.supplied_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    {m.member_roster_id
                      ? <span className="font-mono text-[11px] text-neutral-300">{m.member_roster_id}</span>
                      : <span className="text-[11px] text-neutral-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {m.user_id
                      ? <span className="flex items-center gap-1 text-[11px] text-[#00e482]"><Check size={11} />Linked</span>
                      : <span className="flex items-center gap-1 text-[11px] text-neutral-600"><CircleMinus size={11} />No account</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      text={m.status}
                      colorClass={m.status === "active" ? "text-[#00e482] border-[#00e482]/30 bg-[#00e482]/10" : "text-red-400 border-red-800/40 bg-red-950/30"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roles.length === 0
                        ? <span className="text-[11px] text-neutral-700">—</span>
                        : roles.map((r) => <Badge key={r} text={r} colorClass={ROLE_COLORS[r] ?? ""} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.user_id && (
                      <div className="flex flex-wrap gap-1">
                        {(["admin", "officer", "member"] as const).map((role) => {
                          const has = roles.includes(role);
                          const isSelf = m.participant_id === callerParticipantId && role === "admin";
                          return (
                            <button
                              key={role}
                              type="button"
                              disabled={isSelf}
                              onClick={() => toggleRole(m.participant_id, role, has)}
                              title={isSelf ? "Cannot revoke own admin role" : has ? `Revoke ${role}` : `Grant ${role}`}
                              className={[
                                "rounded px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-30",
                                has
                                  ? "border border-red-800/40 bg-red-950/30 text-red-400 hover:bg-red-900/40"
                                  : "border border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200",
                              ].join(" ")}
                            >
                              {has ? `− ${role}` : `+ ${role}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="flex items-center gap-1 rounded-md border border-neutral-800 px-3 py-1.5 text-xs transition-colors hover:border-neutral-700 disabled:opacity-30">
              <ChevronLeft size={12} /> Prev
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-md border border-neutral-800 px-3 py-1.5 text-xs transition-colors hover:border-neutral-700 disabled:opacity-30">
              Next <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Events ──────────────────────────────────────────────────────────────

function EventsTab() {
  const [events, setEvents]   = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/events");
    if (res.ok) { const d = await res.json(); setEvents(d.events); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(eventId: string, status: string) {
    const res = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, status }),
    });
    const data = await res.json();
    if (!res.ok) { setToast({ message: data.error ?? "Failed", type: "error" }); return; }
    setToast({ message: "Status updated", type: "success" });
    load();
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <div className="mb-5 flex items-center justify-between">
        <SectionHeader title="Events" sub={`${events.length} event${events.length !== 1 ? "s" : ""}`} />
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300 disabled:opacity-40">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-[#00e482] px-3 py-1.5 text-xs font-semibold text-[#161d27] transition-opacity hover:opacity-90">
            <Plus size={13} /> New Event
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateEventForm onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} setToast={setToast} />
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60">
              {["Event", "Date", "Registrations", "Status", "Change Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="py-12 text-center text-neutral-600"><Loader2 size={20} className="mx-auto animate-spin" /></td></tr>
            )}
            {!loading && events.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-neutral-600">No events yet</td></tr>
            )}
            {!loading && events.map((e) => (
              <tr key={e.event_id} className="border-b border-neutral-800/60 transition-colors hover:bg-neutral-800/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-100 max-w-[200px] truncate">{e.name}</p>
                  {e.location && <p className="text-[11px] text-neutral-600 truncate max-w-[200px]">{e.location}</p>}
                </td>
                <td className="px-4 py-3 text-[11px] text-neutral-400 whitespace-nowrap">
                  {fmt(e.starts_at)}<br />
                  <span className="text-neutral-600">→ {fmt(e.ends_at)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5 text-[11px]">
                    <span className="text-neutral-300">{e.registrations.registered} registered</span>
                    <span className="text-[#00e482]">{e.registrations.attended} attended</span>
                    <span className="text-neutral-600">{e.registrations.not_attended} absent</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge text={STATUS_LABELS[e.status]} colorClass={STATUS_COLORS[e.status]} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e.event_id, ev.target.value)}
                    className="rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1.5 text-[11px] text-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#00e482]/30"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateEventForm({ onClose, onCreated, setToast }: {
  onClose: () => void;
  onCreated: () => void;
  setToast: (t: { message: string; type: "success" | "error" }) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", location: "", starts_at: "", ends_at: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.starts_at) errs.starts_at = "Start date/time is required.";
    if (!form.ends_at) errs.ends_at = "End date/time is required.";
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at))
      errs.ends_at = "End must be after start.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setToast({ message: data.error ?? "Failed to create event", type: "error" }); return; }
    setToast({ message: "Event created", type: "success" });
    onCreated();
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-700 bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-100">New Event</h3>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-neutral-600 hover:text-neutral-300"><X size={14} /></button>
      </div>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-400">Event name *</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. AWS Cloud Day" className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-400">Location</label>
          <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. AVR, PnC Main Campus" className={inputCls()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-400">Description</label>
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className={inputCls()} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-400">Starts at *</label>
          <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} className={inputCls(!!errors.starts_at)} />
          {errors.starts_at && <p className="text-xs text-red-400">{errors.starts_at}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-400">Ends at *</label>
          <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} className={inputCls(!!errors.ends_at)} />
          {errors.ends_at && <p className="text-xs text-red-400">{errors.ends_at}</p>}
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-neutral-800 px-4 py-2 text-sm text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#161d27] px-4 py-2 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />} Create Event
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Tab: Provision ───────────────────────────────────────────────────────────

function ProvisionTab() {
  const [memberId, setMemberId] = useState("");
  const [email, setEmail]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [result, setResult]     = useState<{ success: true; temporaryPassword: string; authUserId: string } | { success: false; error: string } | null>(null);
  const [errors, setErrors]     = useState<{ memberId?: string; email?: string }>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({}); setResult(null);
    const errs: typeof errors = {};
    if (!/^SBG-UC-\d{6}$/.test(memberId.trim())) errs.memberId = "Must be SBG-UC-YYXXXX format.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    const res = await fetch("/api/admin/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_SECRET ?? ""}` },
      body: JSON.stringify({ memberId: memberId.trim(), email: email.trim().toLowerCase() }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || !data.success) {
      setResult({ success: false, error: data.error ?? "Provisioning failed." });
      return;
    }
    setResult({ success: true, temporaryPassword: data.result.temporaryPassword, authUserId: data.result.authUserId });
    setMemberId(""); setEmail("");
  }

  return (
    <div className="max-w-md">
      <SectionHeader title="Provision Account" sub="Create a login account for an existing SBG member." />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Member ID *</label>
          <input
            value={memberId}
            onChange={(e) => { setMemberId(e.target.value.toUpperCase()); setErrors((err) => ({ ...err, memberId: "" })); }}
            placeholder="SBG-UC-260001"
            className={inputCls(!!errors.memberId)}
          />
          {errors.memberId
            ? <p className="text-xs text-red-400">{errors.memberId}</p>
            : <p className="text-xs text-neutral-600">Must already exist in the member roster.</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-300">Email address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((err) => ({ ...err, email: "" })); }}
            placeholder="member@example.com"
            className={inputCls(!!errors.email)}
          />
          {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#161d27] px-4 py-3 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          Provision Account
        </button>
      </form>

      {result && (
        <div className={`mt-5 rounded-xl border p-5 ${result.success ? "border-[#00e482]/20 bg-[#00e482]/5" : "border-red-800/40 bg-red-950/20"}`}>
          {result.success ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Check size={15} className="text-[#00e482]" />
                <p className="text-sm font-semibold text-[#00e482]">Account provisioned</p>
              </div>
              <p className="text-xs text-neutral-400 mb-2">Share these credentials securely:</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
                  <span className="text-xs text-neutral-500">Temporary password</span>
                  <span className="font-mono text-sm text-neutral-100 select-all">{result.temporaryPassword}</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-600">The member must change their password on first login.</p>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-sm text-red-400">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Roles ───────────────────────────────────────────────────────────────

function RolesTab() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!v.trim()) { setMembers([]); return; }
      setLoading(true);
      const res = await fetch(`/api/admin/members?q=${encodeURIComponent(v)}&page=1`);
      if (res.ok) { const d = await res.json(); setMembers(d.members.filter((m: MemberRow) => !!m.user_id)); }
      setLoading(false);
    }, 350);
  }

  async function toggleRole(participantId: string, role: string, hasRole: boolean) {
    const res = await fetch("/api/admin/roles", {
      method: hasRole ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId, role }),
    });
    const data = await res.json();
    if (!res.ok) { setToast({ message: data.error ?? "Failed", type: "error" }); return; }
    setToast({ message: `${hasRole ? "Revoked" : "Granted"}: ${role}`, type: "success" });
    // Refresh the row
    const updated = await fetch(`/api/admin/members?q=${encodeURIComponent(search)}&page=1`);
    if (updated.ok) { const d = await updated.json(); setMembers(d.members.filter((m: MemberRow) => !!m.user_id)); }
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <SectionHeader title="Role Management" sub="Search for an account and grant or revoke roles." />

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, username, or email…"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-8 pr-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#00e482]/20"
        />
      </div>

      {loading && <div className="py-8 text-center text-neutral-600"><Loader2 size={18} className="mx-auto animate-spin" /></div>}

      {!loading && search && members.length === 0 && (
        <p className="text-sm text-neutral-600">No accounts found.</p>
      )}

      <div className="flex flex-col gap-3">
        {members.map((m) => {
          const roles = m.participant_roles.map((r) => r.role);
          const handle = m.profiles?.username ?? m.display_name;
          return (
            <div key={m.participant_id} className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-neutral-100">{handle}</p>
                <p className="text-xs text-neutral-600">{m.email ?? m.supplied_name}</p>
                {m.member_roster_id && <p className="font-mono text-[10px] text-neutral-700">{m.member_roster_id}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["admin", "officer", "member"] as const).map((role) => {
                  const has = roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(m.participant_id, role, has)}
                      className={[
                        "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                        has
                          ? ROLE_COLORS[role] + " hover:bg-red-950/50"
                          : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200",
                      ].join(" ")}
                    >
                      {has ? `✓ ${role}` : `+ ${role}`}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "members",   label: "Members",   icon: Users },
  { id: "events",    label: "Events",    icon: CalendarDays },
  { id: "provision", label: "Provision", icon: UserCog },
  { id: "roles",     label: "Roles",     icon: ShieldCheck },
];

export function AdminDashboard({ callerParticipantId }: { callerParticipantId: string }) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00e482]/20 bg-[#00e482]/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#00e482]">
          <ShieldCheck size={12} /> Admin
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-100">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage members, events, accounts, and roles.</p>
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-neutral-800 pb-px">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              "flex shrink-0 items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors",
              tab === id
                ? "border-b-2 border-[#00e482] text-[#00e482]"
                : "text-neutral-500 hover:text-neutral-300",
            ].join(" ")}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview"  && <OverviewTab />}
      {tab === "members"   && <MembersTab callerParticipantId={callerParticipantId} />}
      {tab === "events"    && <EventsTab />}
      {tab === "provision" && <ProvisionTab />}
      {tab === "roles"     && <RolesTab />}
    </div>
  );
}
