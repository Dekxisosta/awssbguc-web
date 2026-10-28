"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { SidePixels, PixelClouds } from "@/src/widgets/home-client";
import { EDITABLE_FIELDS, FIELD_LABELS } from "@/src/entities/student-data";
import { QueryProvider } from "@/src/shared/lib/query";
import {
  BOX, BTN_PRIMARY, BTN_SECONDARY, BTN_SUBMIT, SCROLL_AREA, THEAD_STICKY, TH, focus, inputCls,
} from "./styles";
import { RegistrationSheet } from "./registration-sheet";
import { DeleteEventDialog, EventForm } from "./event-form";
import {
  useDebounced, useEvents, useInvalidateAfterProvision, usePeople,
  usePendingRequestCount, usePerson, useProvisionPending, useRequests, useReviewRequest,
  useRoleSearch, useStats, useToggleRole, useUpdateEventStatus,
} from "../model/queries";
import type {
  EventRow, PendingMember, PersonRow, RequestStatus,
} from "../model/types";
import {
  Users, ShieldCheck, CalendarDays, LayoutDashboard,
  UserCog, Megaphone, Plus, Search, ChevronLeft,
  ChevronRight, RefreshCw, Check, X, AlertTriangle,
  BadgeCheck, Loader2, ClipboardList, ArrowUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type Tab = "overview" | "members" | "events" | "requests" | "provision" | "roles";
type ToastState = { message: string; type: "success" | "error" } | null;

// ─── Shared look — same pixel-art language as the Events page and the nav ─────
// Black ground, butter (#fff7a1) type, Jersey 10 headings, JetBrains Mono text,
// 4px square borders, hard offset shadows, stripe palette for accents.

// Wider than the public pages (max-w-page = 1300px): admin tables and sheets need the room.
const wrap = "mx-auto w-full max-w-[1680px] px-5 sm:px-8";

function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-stripes ${className}`} />;
}

// Event status — same four states as the public Events page, in stripe colours.
const STATUS_LABELS: Record<EventRow["status"], string> = {
  not_started: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<EventRow["status"], string> = {
  not_started: "border-pix-teal text-pix-teal",
  ongoing: "border-pix-green bg-pix-green text-black",
  completed: "border-pix-butter/50 text-pix-butter/70",
  cancelled: "border-pix-rust bg-pix-rust text-pix-butter",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "border-pix-mustard bg-pix-mustard text-black",
  officer: "border-pix-teal text-pix-teal",
  member: "border-pix-butter/50 text-pix-butter/70",
};

const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  active: "border-pix-green bg-pix-green text-black",
};
const ACCOUNT_STATUS_FALLBACK = "border-pix-rust bg-pix-rust text-pix-butter";

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center border-2 px-2 py-0.5 text-sm leading-tight ${colorClass}`}>
      {text}
    </span>
  );
}

const STAT_BORDERS = [
  "border-pix-teal shadow-pixel-teal-4",
  "border-pix-green shadow-pixel-green-4",
  "border-pix-mustard shadow-pixel-mustard-4",
  "border-pix-rust shadow-pixel-rust-4",
  "border-pix-teal shadow-pixel-teal-4",
];

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number | null; tone: number;
}) {
  return (
    <div className={`border-4 bg-black px-3 py-2 ${STAT_BORDERS[tone % STAT_BORDERS.length]}`}>
      <div className="flex items-center justify-between text-base text-pix-butter/70">
        <p>{label}</p>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className={`${hd} text-3xl tabular-nums`}>
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}

function Toast({ message, type, onDismiss }: { message: string; type: "success" | "error"; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);
  // Rendered into <body>: the admin page sits inside `isolate` / `z-10` stacking contexts, so a fixed
  // element rendered in place can never rise above the site's navbar (z-20) or other portaled overlays.
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="status"
      style={{ zIndex: 99999 }}
      className={`${bodyFont.className} fixed bottom-6 right-6 flex items-center gap-3 border-4 border-pix-butter bg-black px-3 py-1 text-base text-pix-butter ${
        type === "success" ? "shadow-pixel-green-4" : "shadow-pixel-rust-4"
      }`}
    >
      {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      {message}
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className={`ml-1 opacity-70 hover:opacity-100 ${focus}`}>
        <X size={14} />
      </button>
    </div>,
    document.body,
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className={`${hd} text-2xl sm:text-3xl`}>{title}</h2>
      {sub && <p className="text-sm text-pix-butter/70">{sub}</p>}
    </div>
  );
}

function RefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={BTN_SECONDARY}>
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
    </button>
  );
}

function SearchInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pix-butter/50" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${inputCls()} pl-9`}
      />
    </div>
  );
}

function RoleToggles({ roles, participantId, callerParticipantId, onToggle, size = "sm" }: {
  roles: string[];
  participantId: string;
  callerParticipantId?: string;
  onToggle: (participantId: string, role: string, has: boolean) => void;
  size?: "sm" | "md";
}) {
  const pad = size === "md" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-sm";
  return (
    <div className="flex flex-wrap gap-2">
      {(["admin", "officer", "member"] as const).map((role) => {
        const has = roles.includes(role);
        const isSelf = participantId === callerParticipantId && role === "admin";
        return (
          <button
            key={role}
            type="button"
            disabled={isSelf}
            onClick={() => onToggle(participantId, role, has)}
            title={isSelf ? "You can't revoke your own admin role" : has ? `Revoke ${role}` : `Grant ${role}`}
            className={[
              "border-2 transition-colors disabled:pointer-events-none disabled:opacity-40",
              focus, pad,
              has
                ? `${ROLE_COLORS[role]} hover:border-pix-rust hover:bg-pix-rust hover:text-pix-butter`
                : "border-pix-butter/40 text-pix-butter/80 hover:bg-pix-butter hover:text-black",
            ].join(" ")}
          >
            {has ? `Remove ${role}` : `Add ${role}`}
          </button>
        );
      })}
    </div>
  );
}

function Spinner() {
  return <Loader2 size={22} className="mx-auto animate-spin text-pix-butter/60" />;
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isFetching: statsFetching, refetch: refetchStats } = useStats();
  const { data: events, isFetching: eventsFetching, refetch: refetchEvents } = useEvents();

  // First three events that are ongoing or upcoming: ongoing first, then soonest start.
  const activeEvents = (events ?? [])
    .filter((e) => e.status === "ongoing" || e.status === "not_started")
    .sort((a, b) =>
      (a.status === b.status ? 0 : a.status === "ongoing" ? -1 : 1) ||
      new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 3);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <SectionHeader title="Overview" sub="Platform-wide counts at a glance." />
        <RefreshButton onClick={() => { refetchStats(); refetchEvents(); }} loading={statsFetching || eventsFetching} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard tone={0} icon={Users}        label="Participants"  value={stats?.participantCount  ?? null} />
        <StatCard tone={1} icon={BadgeCheck}   label="Members"       value={stats?.memberCount       ?? null} />
        <StatCard tone={2} icon={ShieldCheck}  label="Accounts"      value={stats?.accountCount      ?? null} />
        <StatCard tone={3} icon={CalendarDays} label="Events"        value={stats?.eventCount        ?? null} />
        <StatCard tone={4} icon={Megaphone}    label="Registrations" value={stats?.registrationCount ?? null} />
      </div>

      <div className="mt-6">
        <SectionHeader title="Upcoming & ongoing" sub="The next three events that are live or still to come." />
        {!events ? (
          <p className="mt-3 text-base text-pix-butter/55">Loading events…</p>
        ) : activeEvents.length === 0 ? (
          <p className="mt-3 border-4 border-pix-butter/25 px-3 py-2 text-base text-pix-butter/70">
            No upcoming or ongoing events.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {activeEvents.map((e, i) => (
              <article key={e.event_id} className={`border-4 bg-black p-3 ${STAT_BORDERS[i % STAT_BORDERS.length]}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`${hd} min-w-0 break-words text-2xl leading-tight`}>{e.name}</h3>
                  <Pill text={STATUS_LABELS[e.status]} colorClass={STATUS_COLORS[e.status]} />
                </div>
                <p className="mt-2 text-base text-pix-butter/80">{fmtDateTime(e.starts_at)}</p>
                {e.location && <p className="text-sm text-pix-butter/60">{e.location}</p>}
                <p className="mt-2 text-sm text-pix-butter/70">
                  {e.registrations.registered + e.registrations.attended + e.registrations.not_attended} registered
                  {e.registrations.attended > 0 && <> · {e.registrations.attended} attended</>}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Members (participants + profiles + roster + student data + events) ──

const PEOPLE_FILTERS: { id: string; label: string }[] = [
  { id: "all",        label: "Everyone" },
  { id: "members",    label: "Members" },
  { id: "accounts",   label: "With account" },
  { id: "no_account", label: "No account" },
  { id: "guests",     label: "Not members" },
];

const REG_COLORS: Record<string, { text: string; cls: string }> = {
  registered:   { text: "Registered", cls: "border-pix-teal text-pix-teal" },
  attended:     { text: "Attended",   cls: "border-pix-green bg-pix-green text-black" },
  not_attended: { text: "Absent",     cls: "border-pix-rust bg-pix-rust text-pix-butter" },
};

function fullName(s: PersonRow["student"]) {
  if (!s) return "";
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");
}

function fmtDateTime(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function labelOf(key: string) {
  return key.replace(/_/g, " ");
}

function showValue(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return <span className="text-pix-butter/35">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** One database table, shown as its real columns. */
function TableCard({ table, note, row, children }: {
  table: string; note?: string; row?: Row | null; children?: React.ReactNode;
}) {
  return (
    <section className="border-4 border-pix-teal">
      <header className="flex items-baseline justify-between gap-3 border-b-4 border-pix-teal px-3 py-1">
        <h4 className={`${hd} text-2xl`}>{table}</h4>
        {note && <span className="text-sm text-pix-butter/55">{note}</span>}
      </header>
      {row === null ? (
        <p className="px-3 py-1 text-base text-pix-butter/55">No row — nothing linked in this table.</p>
      ) : row ? (
        <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-0.5 px-3 py-1 text-base">
          {Object.entries(row).map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-pix-butter/55">{labelOf(k)}</dt>
              <dd className="min-w-0 break-words">{showValue(v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {children}
    </section>
  );
}

function SchemaLegend() {
  const links: [string, string][] = [
    ["participants.user_id", "profiles.profile_id (= auth account)"],
    ["participants.member_roster_id", "member_roster.member_id"],
    ["member_roster.student_number", "student_data.student_number"],
    ["participant_roles.participant_id", "participants.participant_id"],
    ["event_registrations (event_id, participant_id)", "events · participants"],
  ];
  return (
    <div className="mt-3 border-4 border-pix-butter/25 p-4">
      <p className="text-base">
        A <span className="text-pix-teal">participant</span> is anyone who can attend events — members and guests alike.
        Members are linked to a roster entry and their student record; people with a login also have a profile.
      </p>
      <ul className="mt-3 space-y-1 text-base text-pix-butter/70">
        {links.map(([a, b]) => (
          <li key={a}>
            <span className="text-pix-butter">{a}</span> <span className="text-pix-teal">→</span> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PersonDrawer({ participantId, callerParticipantId, onClose, setToast }: {
  participantId: string;
  callerParticipantId: string;
  onClose: () => void;
  setToast: (t: ToastState) => void;
}) {
  // Cached per person and re-polled while the drawer is open, so role changes and event
  // registrations made elsewhere show up without reopening it.
  const { data: detail, error: loadError } = usePerson(participantId);
  const error = !detail && loadError ? loadError.message : null;
  const toggle = useToggleRole();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleRole(pid: string, role: string, has: boolean) {
    toggle.mutate(
      { participantId: pid, role, has },
      {
        onSuccess: () => setToast({ message: `Role ${has ? "revoked" : "granted"}: ${role}`, type: "success" }),
        onError: (e) => setToast({ message: e.message || "Failed to update role", type: "error" }),
      },
    );
  }

  const p = detail?.participant;
  const roleNames = detail?.roles.map((r) => r.role) ?? [];
  const avatar = detail?.profile && typeof detail.profile.avatar_url === "string" ? detail.profile.avatar_url : null;

  // Rendered into <body>, not in place. In place, this `fixed` panel is trapped inside the admin page's
  // stacking context (z-10), which sits below the sticky navbar (z-20), so the navbar covered the top of
  // the panel. In <body> it can sit above the navbar; 99990 stays under the toast (99999) and the
  // site-wide search modal (100000).
  if (typeof document === "undefined") return null;
  return createPortal(
    <div style={{ zIndex: 99990 }} className="fixed inset-0 flex justify-end" role="dialog" aria-modal="true" aria-label="Person details">
      <button type="button" aria-label="Close details" onClick={onClose} className="absolute inset-0 cursor-default bg-black/70" />
      <div className={`${bodyFont.className} relative flex h-full w-full max-w-2xl flex-col overflow-y-auto overscroll-contain border-l-4 border-pix-teal bg-black text-pix-butter`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b-4 border-pix-teal bg-black px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            {avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-14 w-14 shrink-0 border-4 border-pix-butter object-cover" />
            )}
            <div className="min-w-0">
              <h3 className={`${hd} truncate text-4xl`}>{p ? String(p.display_name) : "Loading…"}</h3>
              {p && <p className="truncate text-base text-pix-butter/60">{String(p.supplied_name)}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" autoFocus className={`border-4 border-pix-butter/60 p-1.5 transition-colors hover:bg-pix-butter hover:text-black ${focus}`}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {error && <p role="alert" className="border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">{error}</p>}
          {!detail && !error && <div className="py-10"><Spinner /></div>}

          {detail && p && (
            <>
              <TableCard table="participants" note="who they are" row={p} />

              <TableCard table="profiles" note={detail.participant.user_id ? "app account settings" : "no login yet"} row={detail.profile ?? null} />

              <TableCard table="member_roster" note="membership" row={detail.roster} />

              <TableCard table="student_data" note="student record" row={detail.student} />

              <TableCard table="participant_roles" note="permissions">
                <div className="px-3 py-1">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {detail.roles.length === 0
                      ? <span className="text-base text-pix-butter/55">No roles.</span>
                      : detail.roles.map((r) => (
                          <span key={r.role} className="flex items-center gap-2">
                            <Pill text={r.role} colorClass={ROLE_COLORS[r.role] ?? ROLE_COLORS.member} />
                            <span className="text-sm text-pix-butter/45">since {fmt(r.granted_at)}</span>
                          </span>
                        ))}
                  </div>
                  {detail.participant.user_id ? (
                    <RoleToggles
                      roles={roleNames}
                      participantId={String(p.participant_id)}
                      callerParticipantId={callerParticipantId}
                      onToggle={toggleRole}
                      size="md"
                    />
                  ) : (
                    <p className="text-sm text-pix-butter/55">Roles can be changed once they have an account.</p>
                  )}
                </div>
              </TableCard>

              <TableCard table="event_registrations" note={`${detail.registrations.length} event${detail.registrations.length !== 1 ? "s" : ""}`}>
                {detail.registrations.length === 0 ? (
                  <p className="px-3 py-1 text-base text-pix-butter/55">Not registered for any event.</p>
                ) : (
                  <ul>
                    {detail.registrations.map((r) => (
                      <li key={r.event_id} className="flex flex-col gap-2 border-b-2 border-pix-butter/15 px-3 py-1 last:border-0 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-base">{r.name}</p>
                          <p className="text-sm text-pix-butter/55">
                            {fmtDateTime(r.starts_at)}{r.location ? ` · ${r.location}` : ""}
                          </p>
                          {r.affiliation && <p className="text-sm text-pix-butter/55">Affiliation: {r.affiliation}</p>}
                          {r.note && <p className="text-sm text-pix-butter/55">Note: {r.note}</p>}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          <Pill text={(REG_COLORS[r.status] ?? REG_COLORS.registered).text} colorClass={(REG_COLORS[r.status] ?? REG_COLORS.registered).cls} />
                          {r.event_status && <Pill text={STATUS_LABELS[r.event_status] ?? r.event_status} colorClass={STATUS_COLORS[r.event_status] ?? ""} />}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCard>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MembersTab({ callerParticipantId }: { callerParticipantId: string }) {
  const [page, setPage]             = useState(1);
  const [filter, setFilter]         = useState("all");
  const [search, setSearch]         = useState("");
  const [openId, setOpenId]         = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [toast, setToast]           = useState<ToastState>(null);

  const debouncedSearch = useDebounced(search).trim();
  const { data, isLoading: loading, error } = usePeople(page, filter, debouncedSearch);
  const people: PersonRow[] = data?.people ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const loadError = error ? error.message : null;

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader title="Members" sub={`${total.toLocaleString()} participant${total !== 1 ? "s" : ""}`} />
        <SearchInput value={search} onChange={handleSearch} placeholder="Name, username, ID, email…" className="w-full sm:w-72" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PEOPLE_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => { setFilter(f.id); setPage(1); }}
              className={`border-4 px-3 py-0.5 text-base transition-colors ${focus} ${
                active
                  ? "border-black bg-pix-butter text-black shadow-pixel-teal-3"
                  : "border-pix-teal hover:bg-pix-teal hover:text-black"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <button type="button" onClick={() => setShowSchema((v) => !v)} aria-expanded={showSchema} className={`${BTN_SECONDARY} ml-auto !py-1`}>
          {showSchema ? "Hide" : "How the tables link"}
        </button>
      </div>

      {showSchema && <SchemaLegend />}

      {loadError && (
        <p role="alert" className="mt-3 inline-block border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">{loadError}</p>
      )}

      <div className={`${BOX} mt-3 ${SCROLL_AREA}`}>
        <table className="w-full min-w-[860px] text-base">
          <thead className={THEAD_STICKY}>
            <tr className="border-b-4 border-pix-teal">
              {["Person", "Membership", "Account", "Roles", "Events", ""].map((h, i) => (
                <th key={i} scope="col" className={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="py-5"><Spinner /></td></tr>}
            {!loading && people.length === 0 && (
              <tr><td colSpan={6} className="py-5 text-center text-pix-butter/60">No results.</td></tr>
            )}
            {!loading && people.map((m) => {
              const username = typeof m.profile?.username === "string" ? m.profile.username : null;
              const setupDone = m.profile?.initial_setup_completed;
              const real = fullName(m.student);
              return (
                <tr key={m.participantId} className="border-b-2 border-pix-butter/15 last:border-0 transition-colors hover:bg-pix-butter/5">
                  <td className="px-3 py-1">
                    <p className="max-w-[210px] truncate">{m.displayName}</p>
                    <p className="max-w-[210px] truncate text-sm text-pix-butter/55">
                      {username ? `@${username} · ` : ""}{m.email ?? m.suppliedName}
                    </p>
                  </td>
                  <td className="px-3 py-1">
                    {m.memberId ? (
                      <>
                        <p className="text-base">{m.memberId}</p>
                        <p className="max-w-[220px] truncate text-sm text-pix-butter/55">
                          {[real, m.student?.program, m.student?.year_level && `Y${m.student.year_level}`, m.student?.section]
                            .filter(Boolean).join(" · ") || m.student?.student_number}
                        </p>
                      </>
                    ) : (
                      <span className="text-base text-pix-butter/45">Not a member</span>
                    )}
                  </td>
                  <td className="px-3 py-1 text-base">
                    {m.userId ? (
                      <span className={`flex items-center gap-1.5 ${setupDone === false ? "text-pix-mustard" : "text-pix-green"}`}>
                        <Check size={14} />{setupDone === false ? "Setup pending" : "Linked"}
                      </span>
                    ) : (
                      <span className="text-pix-butter/50">No account</span>
                    )}
                  </td>
                  <td className="px-3 py-1">
                    <div className="flex flex-wrap gap-1.5">
                      {m.roles.length === 0
                        ? <span className="text-pix-butter/35">—</span>
                        : m.roles.map((r) => <Pill key={r} text={r} colorClass={ROLE_COLORS[r] ?? ROLE_COLORS.member} />)}
                    </div>
                  </td>
                  <td className="px-3 py-1 text-base">
                    {m.events.registered === 0 ? (
                      <span className="text-pix-butter/35">—</span>
                    ) : (
                      <>
                        <p>{m.events.registered} registered</p>
                        <p className="text-sm text-pix-green">{m.events.attended} attended</p>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-1 text-right">
                    <button type="button" onClick={() => setOpenId(m.participantId)} className={`${BTN_SECONDARY} !py-0.5`}>
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-base">
          <span className="text-pix-butter/70">Page {page} of {totalPages}</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={BTN_SECONDARY}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className={BTN_SECONDARY}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {openId && (
        <PersonDrawer
          participantId={openId}
          callerParticipantId={callerParticipantId}
          onClose={() => setOpenId(null)}
          setToast={setToast}
        />
      )}
    </div>
  );
}

// ─── Tab: Events ──────────────────────────────────────────────────────────────

function EventsTab() {
  const [toast, setToast]           = useState<ToastState>(null);
  // null = list; "new" = create form; an event id = edit form for that event.
  const [formFor, setFormFor] = useState<"new" | string | null>(null);
  const [deleting, setDeleting] = useState<EventRow | null>(null);
  const [sheetEventId, setSheetEventId] = useState<string | null>(null);

  const { data: events = [], isLoading: loading, isFetching, error, refetch } = useEvents();
  const statusMutation = useUpdateEventStatus();

  function updateStatus(eventId: string, status: string) {
    statusMutation.mutate(
      { eventId, status },
      {
        onSuccess: () => setToast({ message: "Status updated", type: "success" }),
        onError: (e) => setToast({ message: e.message || "Failed", type: "error" }),
      },
    );
  }

  // Spreadsheet view of one event's registrations and attendance — replaces the list until closed.
  if (sheetEventId) {
    return (
      <div>
        {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
        <RegistrationSheet eventId={sheetEventId} onBack={() => setSheetEventId(null)} setToast={setToast} />
      </div>
    );
  }

  // Create / edit form — replaces the list until closed, like the registrations sheet.
  if (formFor) {
    const target = formFor === "new" ? undefined : events.find((e) => e.event_id === formFor);
    if (formFor === "new" || target) {
      return (
        <div>
          {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
          <EventForm event={target} onClose={() => setFormFor(null)} setToast={setToast} />
        </div>
      );
    }
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader title="Events" sub={`${events.length} event${events.length !== 1 ? "s" : ""}`} />
        <div className="flex flex-wrap gap-3">
          <RefreshButton onClick={() => refetch()} loading={isFetching} />
          <button type="button" onClick={() => setFormFor("new")} className={BTN_PRIMARY}>
            <Plus size={14} /> New event
          </button>
        </div>
      </div>

      {error && events.length === 0 && (
        <p role="alert" className="mt-3 inline-block border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">{error.message}</p>
      )}

      {deleting && (
        <DeleteEventDialog
          event={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => setDeleting(null)}
          setToast={setToast}
        />
      )}

      <div className={`${BOX} mt-3 ${SCROLL_AREA}`}>
        <table className="w-full min-w-[820px] text-base">
          <thead className={THEAD_STICKY}>
            <tr className="border-b-4 border-pix-teal">
              {["Event", "Date", "Registrations", "Status", "Change status", "Actions"].map((h) => (
                <th key={h} scope="col" className={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="py-5"><Spinner /></td></tr>
            )}
            {!loading && events.length === 0 && (
              <tr><td colSpan={6} className="py-5 text-center text-pix-butter/60">No events yet.</td></tr>
            )}
            {!loading && events.map((e) => (
              <tr key={e.event_id} className="border-b-2 border-pix-butter/15 last:border-0 transition-colors hover:bg-pix-butter/5">
                <td className="px-3 py-1">
                  <p className="flex max-w-[260px] items-center gap-2">
                    <span className="truncate">{e.name}</span>
                    {!e.is_published && <Pill text="Draft" colorClass="border-pix-mustard text-pix-mustard" />}
                  </p>
                  {e.location && <p className="max-w-[230px] truncate text-sm text-pix-butter/55">{e.location}</p>}
                </td>
                <td className="whitespace-nowrap px-3 py-1 text-base text-pix-butter/80">
                  {fmt(e.starts_at)}
                  <br />
                  <span className="text-pix-butter/50">to {fmt(e.ends_at)}</span>
                </td>
                <td className="px-3 py-1">
                  <div className="flex flex-col text-base">
                    <span>{e.registrations.registered} registered</span>
                    <span className="text-pix-green">{e.registrations.attended} attended</span>
                    <span className="text-pix-butter/50">{e.registrations.not_attended} absent</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetEventId(e.event_id)}
                    aria-label={`Open registrations sheet for ${e.name}`}
                    className={`${BTN_SECONDARY} mt-1 !py-0 text-sm`}
                  >
                    Open sheet
                  </button>
                </td>
                <td className="px-3 py-1">
                  <Pill text={STATUS_LABELS[e.status]} colorClass={STATUS_COLORS[e.status]} />
                </td>
                <td className="px-3 py-1">
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e.event_id, ev.target.value)}
                    aria-label={`Change status for ${e.name}`}
                    className={`border-4 border-pix-teal bg-black px-2 py-1 text-base text-pix-butter ${focus}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <div className="flex flex-col items-start gap-1">
                    <button
                      type="button"
                      onClick={() => setFormFor(e.event_id)}
                      aria-label={`Edit ${e.name}`}
                      className={`${BTN_SECONDARY} !py-0 text-sm`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(e)}
                      aria-label={`Delete ${e.name}`}
                      className={`inline-flex items-center gap-1 border-2 border-pix-rust px-2 text-sm transition-colors hover:bg-pix-rust ${focus}`}
                    >
                      Delete
                    </button>
                    <a
                      href={`/events/${e.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${e.is_published ? "View" : "Preview"} the public page for ${e.name}`}
                      className={`text-sm underline underline-offset-4 hover:text-pix-teal ${focus}`}
                    >
                      {e.is_published ? "View page" : "Preview"} ↗
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, error, hint, className = "", children }: {
  label: string; error?: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-base">{label}</span>
      {children}
      {error
        ? <span className="text-base text-pix-coral" role="alert">{error}</span>
        : hint && <span className="text-base text-pix-butter/55">{hint}</span>}
    </label>
  );
}

// ─── Tab: Provision ───────────────────────────────────────────────────────────

interface ResultRow {
  memberId: string;
  name: string;
  email: string;
  temporaryPassword: string;
  mail: "sent" | "failed" | "off";
  mailReason?: string;
}

interface BatchOutcome {
  rows: ResultRow[];
  errors: { memberId: string; name: string; reason: string }[];
  mailRequested: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHUNK = 20; // members per request — keeps each call well inside the server time limit

function csvCell(v: string) {
  return `"${v.replace(/"/g, '""')}"`;
}

function ProvisionTab() {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [emails, setEmails]         = useState<Record<string, string>>({});
  const [sendEmail, setSendEmail]   = useState(true);
  const [running, setRunning]       = useState(false);
  const [progress, setProgress]     = useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome]       = useState<BatchOutcome | null>(null);
  const [toast, setToast]           = useState<ToastState>(null);

  // Polling pauses while a batch is running so the list doesn't shift mid-run.
  const query = useProvisionPending(running);
  const invalidateAfterProvision = useInvalidateAfterProvision();
  const pending: PendingMember[] = query.data?.members ?? [];
  const accountCount = query.data?.accountCount ?? 0;
  const mailConfigured = !!query.data?.mailConfigured;
  const emailOn = mailConfigured && sendEmail;
  const loading = query.isLoading;
  const loadError = !query.data && query.error ? query.error.message : null;

  const emailFor = (p: PendingMember) => (emails[p.memberId] ?? p.email ?? "").trim();

  const q = search.trim().toLowerCase();
  const visible = pending.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.memberId.toLowerCase().includes(q) ||
      emailFor(p).toLowerCase().includes(q)
  );
  const selectable = visible.filter((p) => EMAIL_RE.test(emailFor(p)));
  const allSelected = selectable.length > 0 && selectable.every((p) => selected.has(p.memberId));
  const chosen = pending.filter((p) => selected.has(p.memberId) && EMAIL_RE.test(emailFor(p)));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((s) => {
      const next = new Set(s);
      if (allSelected) selectable.forEach((p) => next.delete(p.memberId));
      else selectable.forEach((p) => next.add(p.memberId));
      return next;
    });
  }

  async function run() {
    if (chosen.length === 0 || running) return;
    setRunning(true);
    setOutcome(null);

    const rows: ResultRow[] = [];
    const errors: BatchOutcome["errors"] = [];
    const nameOf = new Map(chosen.map((p) => [p.memberId, p.name]));

    for (let i = 0; i < chosen.length; i += CHUNK) {
      const chunk = chosen.slice(i, i + CHUNK);
      setProgress({ done: i, total: chosen.length });
      const failChunk = (reason: string) =>
        chunk.forEach((p) => errors.push({ memberId: p.memberId, name: p.name, reason }));

      try {
        const res = await fetch("/api/admin/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            members: chunk.map((p) => ({ memberId: p.memberId, email: emailFor(p).toLowerCase(), name: p.name })),
            sendEmail: emailOn,
          }),
        });
        const d = await res.json().catch(() => ({} as Record<string, any>));
        if (!res.ok) { failChunk(d.error ?? `Request failed (HTTP ${res.status}).`); continue; }

        const sent = new Set<string>(d.mail?.sent ?? []);
        const failed = new Map<string, string>(
          (d.mail?.failed ?? []).map((f: { memberId: string; reason: string }) => [f.memberId, f.reason])
        );
        for (const c of d.credentials ?? []) {
          rows.push({
            memberId: c.memberId,
            name: nameOf.get(c.memberId) ?? "",
            email: c.email,
            temporaryPassword: c.temporaryPassword,
            mail: !emailOn ? "off" : sent.has(c.memberId) ? "sent" : "failed",
            mailReason: failed.get(c.memberId),
          });
        }
        for (const er of d.errors ?? []) {
          errors.push({ memberId: er.memberId, name: nameOf.get(er.memberId) ?? "", reason: er.reason });
        }
      } catch {
        failChunk("Network error.");
      }
    }

    setProgress(null);
    setOutcome({ rows, errors, mailRequested: emailOn });
    setSelected(new Set());
    setRunning(false);
    setToast({
      message: `${rows.length} account${rows.length !== 1 ? "s" : ""} created${errors.length ? `, ${errors.length} failed` : ""}`,
      type: errors.length && rows.length === 0 ? "error" : "success",
    });
    invalidateAfterProvision();
  }

  function copyAll() {
    if (!outcome) return;
    const text = outcome.rows
      .map((r) => [r.memberId, r.name, r.email, r.temporaryPassword].join("\t"))
      .join("\n");
    navigator.clipboard.writeText(text).then(
      () => setToast({ message: "Copied to clipboard", type: "success" }),
      () => setToast({ message: "Couldn't copy — use Download CSV", type: "error" })
    );
  }

  function downloadCsv() {
    if (!outcome) return;
    const lines = [
      ["member_id", "name", "email", "temporary_password", "email_status"].join(","),
      ...outcome.rows.map((r) =>
        [r.memberId, r.name, r.email, r.temporaryPassword, r.mail].map(csvCell).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `provisioned-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const MAIL_PILL: Record<ResultRow["mail"], { text: string; cls: string }> = {
    sent:   { text: "Emailed",     cls: "border-pix-green bg-pix-green text-black" },
    failed: { text: "Not emailed", cls: "border-pix-rust bg-pix-rust text-pix-butter" },
    off:    { text: "Show only",   cls: "border-pix-butter/50 text-pix-butter/70" },
  };

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Provision"
          sub={
            loading
              ? "Loading members…"
              : `${pending.length} member${pending.length !== 1 ? "s" : ""} without an account · ${accountCount} with one`
          }
        />
        <RefreshButton onClick={() => query.refetch()} loading={query.isFetching} />
      </div>

      {loadError && (
        <p role="alert" className="mt-4 inline-block border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">
          {loadError}
        </p>
      )}

      {!loadError && (
        <>
          {/* Controls */}
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, ID, email…" className="w-full lg:w-80" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className={`flex items-center gap-2 text-base ${mailConfigured ? "" : "opacity-50"}`}>
                <input
                  type="checkbox"
                  checked={emailOn}
                  disabled={!mailConfigured}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-5 w-5 accent-pix-teal"
                />
                Email temporary passwords
              </label>
              <button type="button" onClick={run} disabled={chosen.length === 0 || running} className={BTN_SUBMIT}>
                {running && <Loader2 size={16} className="animate-spin" />}
                {running && progress
                  ? `Working… ${Math.min(progress.done + CHUNK, progress.total)}/${progress.total}`
                  : `Provision ${chosen.length} selected`}
              </button>
            </div>
          </div>

          {!mailConfigured && !loading && (
            <p className="mt-3 text-base text-pix-butter/60">
              Email isn&apos;t set up on the server yet (needs RESEND_API_KEY and MAIL_FROM), so passwords will only be shown here after provisioning.
            </p>
          )}

          {/* Pending members */}
          <div className={`${BOX} mt-3 ${SCROLL_AREA}`}>
            <table className="w-full min-w-[640px] text-base">
              <thead className={THEAD_STICKY}>
                <tr className="border-b-4 border-pix-teal">
                  <th scope="col" className="w-12 px-3 py-1">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={selectable.length === 0}
                      aria-label="Select all visible members that have an email"
                      className="h-5 w-5 accent-pix-teal"
                    />
                  </th>
                  <th scope="col" className={TH}>Member</th>
                  <th scope="col" className={TH}>Member ID</th>
                  <th scope="col" className={TH}>Email</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="py-5"><Spinner /></td></tr>}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-5 text-center text-pix-butter/60">
                      {pending.length === 0 ? "Everyone on the roster already has an account." : "No matches."}
                    </td>
                  </tr>
                )}
                {!loading && visible.map((p) => {
                  const em = emailFor(p);
                  const valid = EMAIL_RE.test(em);
                  return (
                    <tr key={p.memberId} className="border-b-2 border-pix-butter/15 last:border-0 hover:bg-pix-butter/5">
                      <td className="px-3 py-1">
                        <input
                          type="checkbox"
                          checked={selected.has(p.memberId)}
                          disabled={!valid}
                          onChange={() => toggleOne(p.memberId)}
                          aria-label={`Select ${p.name}`}
                          className="h-5 w-5 accent-pix-teal disabled:opacity-30"
                        />
                      </td>
                      <td className="px-3 py-1"><p className="max-w-[240px] truncate">{p.name}</p></td>
                      <td className="px-3 py-1 text-base text-pix-butter/80">{p.memberId}</td>
                      <td className="px-3 py-1">
                        <input
                          type="email"
                          value={emails[p.memberId] ?? p.email ?? ""}
                          onChange={(e) => setEmails((m) => ({ ...m, [p.memberId]: e.target.value }))}
                          placeholder="Add an email to select"
                          aria-label={`Email for ${p.name}`}
                          className={`w-full min-w-[220px] border-2 bg-black px-2 py-1 text-base text-pix-butter placeholder:text-pix-butter/35 focus:outline-none ${
                            em === ""
                              ? "border-pix-coral/60 focus:border-pix-coral"
                              : valid
                                ? "border-pix-butter/30 focus:border-pix-teal"
                                : "border-pix-rust focus:border-pix-coral"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-base text-pix-butter/55">
            {chosen.length} selected · members need a valid email before they can be selected. Each account must set a permanent password on first sign-in.
          </p>
        </>
      )}

      {/* Result of the last batch */}
      {outcome && (
        <div className="mt-4 border-4 border-pix-butter p-3 shadow-pixel-green-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`${hd} text-3xl`}>Batch result</h3>
              <p className="mt-1 text-base text-pix-butter/70">
                {outcome.rows.length} created · {outcome.errors.length} failed
                {outcome.mailRequested && ` · ${outcome.rows.filter((r) => r.mail === "sent").length} emailed`}
              </p>
            </div>
            {outcome.rows.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={copyAll} className={BTN_SECONDARY}>Copy all</button>
                <button type="button" onClick={downloadCsv} className={BTN_PRIMARY}>Download CSV</button>
              </div>
            )}
          </div>

          {outcome.rows.length > 0 && (
            <>
              <p className="mt-4 text-base text-pix-coral">
                Temporary passwords are shown only now. Copy or download them before leaving this page.
              </p>
              <div className={`${BOX} mt-3 ${SCROLL_AREA}`}>
                <table className="w-full min-w-[640px] text-base">
                  <thead className={THEAD_STICKY}>
                    <tr className="border-b-4 border-pix-teal">
                      {["Member", "Email", "Temporary password", "Email"].map((h) => (
                        <th key={h} scope="col" className={TH}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {outcome.rows.map((r) => (
                      <tr key={r.memberId} className="border-b-2 border-pix-butter/15 last:border-0">
                        <td className="px-3 py-1">
                          <p className="max-w-[200px] truncate">{r.name || r.memberId}</p>
                          <p className="text-sm text-pix-butter/55">{r.memberId}</p>
                        </td>
                        <td className="px-3 py-1">{r.email}</td>
                        <td className="select-all px-4 py-2 text-base">{r.temporaryPassword}</td>
                        <td className="px-3 py-1">
                          <Pill text={MAIL_PILL[r.mail].text} colorClass={MAIL_PILL[r.mail].cls} />
                          {r.mail === "failed" && r.mailReason && (
                            <p className="mt-1 max-w-[220px] text-sm text-pix-coral">{r.mailReason}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {outcome.errors.length > 0 && (
            <div className="mt-3 border-4 border-pix-rust p-4" role="alert">
              <p className="flex items-center gap-2 text-base"><AlertTriangle size={18} /> Couldn&apos;t provision</p>
              <ul className="mt-2 space-y-1 text-base">
                {outcome.errors.map((er) => (
                  <li key={er.memberId}>
                    <span className="text-pix-butter">{er.name ? `${er.name} (${er.memberId})` : er.memberId}</span>
                    <span className="text-pix-butter/60"> — {er.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* One-off: for a member not in the list above */}
      <div className="mt-8 border-t-4 border-pix-butter/20 pt-6">
        <ManualProvision />
      </div>
    </div>
  );
}

// ─── Single-ID provisioning (members not in the pending list) ──────────────────

function ManualProvision() {
  const invalidateAfterProvision = useInvalidateAfterProvision();
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
    try {
      const res = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberId.trim(), email: email.trim().toLowerCase() }),
      });
      // A crashed route returns HTML, not JSON — don't let that leave the form stuck.
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok || !data.success) {
        setResult({
          success: false,
          error: (data.error as string) ?? `Provisioning failed (HTTP ${res.status}). Check the server log.`,
        });
        return;
      }
      setResult({ success: true, temporaryPassword: data.result.temporaryPassword, authUserId: data.result.authUserId });
      setMemberId(""); setEmail("");
      invalidateAfterProvision();
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h3 className={`${hd} text-3xl`}>Provision by member ID</h3>
      <p className="mt-1 text-sm text-pix-butter/70">For a single member who isn&apos;t in the list above.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-3 flex flex-col gap-3">
        <Field label="Member ID *" error={errors.memberId} hint="Must already exist in the member roster.">
          <input
            value={memberId}
            onChange={(e) => { setMemberId(e.target.value.toUpperCase()); setErrors((err) => ({ ...err, memberId: "" })); }}
            placeholder="SBG-UC-260001"
            className={inputCls(!!errors.memberId)}
          />
        </Field>
        <Field label="Email address *" error={errors.email}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((err) => ({ ...err, email: "" })); }}
            placeholder="member@example.com"
            className={inputCls(!!errors.email)}
          />
        </Field>

        <button type="submit" disabled={saving} className={BTN_SUBMIT}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          Provision account
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 border-4 p-5 ${
            result.success
              ? "border-pix-green shadow-pixel-green-4"
              : "border-pix-rust bg-pix-rust"
          }`}
        >
          {result.success ? (
            <>
              <div className="mb-3 flex items-center gap-2 text-pix-green">
                <Check size={18} />
                <p className="text-base">Account provisioned</p>
              </div>
              <p className="mb-2 text-base text-pix-butter/70">Share these credentials securely:</p>
              <div className="flex items-center justify-between gap-3 border-4 border-pix-butter/40 px-4 py-2.5">
                <span className="text-base text-pix-butter/60">Temporary password</span>
                <span className="select-all text-base">{result.temporaryPassword}</span>
              </div>
              <p className="mt-3 text-base text-pix-butter/55">The member must change their password on first login.</p>
            </>
          ) : (
            <div className="flex items-start gap-2.5" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="text-base">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Roles ───────────────────────────────────────────────────────────────

function RolesTab({ callerParticipantId }: { callerParticipantId: string }) {
  const [search, setSearch] = useState("");
  const [toast, setToast]   = useState<ToastState>(null);

  const debounced = useDebounced(search).trim();
  const { data: members = [], isLoading: loading } = useRoleSearch(debounced);
  const toggle = useToggleRole();

  function toggleRole(participantId: string, role: string, hasRole: boolean) {
    toggle.mutate(
      { participantId, role, has: hasRole },
      {
        onSuccess: () => setToast({ message: `${hasRole ? "Revoked" : "Granted"}: ${role}`, type: "success" }),
        onError: (e) => setToast({ message: e.message || "Failed", type: "error" }),
      },
    );
  }

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <SectionHeader title="Roles" sub="Search for an account, then grant or revoke roles." />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name, username, or email…"
        className="mt-3 max-w-md"
      />

      {loading && <div className="py-8"><Spinner /></div>}

      {!loading && debounced && members.length === 0 && (
        <p className="mt-3 text-base text-pix-butter/60">No accounts found.</p>
      )}

      <ul className={`mt-3 space-y-2 ${members.length > 6 ? `${SCROLL_AREA} pr-2` : ""}`}>
        {members.map((m) => {
          const roles = m.participant_roles.map((r) => r.role);
          const handle = m.profiles?.username ?? m.display_name;
          return (
            <li key={m.participant_id} className={`${BOX} flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="min-w-0">
                <p className="truncate text-base">{handle}</p>
                <p className="truncate text-base text-pix-butter/55">{m.email ?? m.supplied_name}</p>
                {m.member_roster_id && <p className="mt-0.5 text-sm text-pix-butter/45">{m.member_roster_id}</p>}
              </div>
              <RoleToggles
                roles={roles}
                participantId={m.participant_id}
                callerParticipantId={callerParticipantId}
                onToggle={toggleRole}
                size="md"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Tab: Requests (student data change requests) ─────────────────────────────

const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Withdrawn",
};

const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "border-pix-mustard text-pix-mustard",
  approved: "border-pix-green bg-pix-green text-black",
  rejected: "border-pix-rust bg-pix-rust text-pix-butter",
  cancelled: "border-pix-butter/50 text-pix-butter/70",
};

function RequestsTab() {
  const [filter, setFilter]     = useState<"pending" | "all">("pending");
  const [toast, setToast]       = useState<ToastState>(null);
  const [notes, setNotes]       = useState<Record<string, string>>({});

  const query = useRequests(filter);
  const requests = query.data?.requests ?? [];
  const loading = query.isLoading;
  const reviewMutation = useReviewRequest();

  function review(id: string, decision: "approve" | "reject") {
    const note = (notes[id] ?? "").trim();
    if (decision === "reject" && note.length < 3) {
      setToast({ message: "Add a short note so the member knows why.", type: "error" });
      return;
    }
    reviewMutation.mutate(
      { id, decision, note },
      {
        onSuccess: () => {
          setToast({ message: decision === "approve" ? "Approved — student record updated" : "Rejected", type: "success" });
          setNotes((n) => { const next = { ...n }; delete next[id]; return next; });
        },
        onError: (e) => setToast({ message: e.message || "Failed", type: "error" }),
      },
    );
  }

  const showValue = (v: string | null | undefined) => (v && v !== "" ? v : "—");

  return (
    <div>
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          title="Requests"
          sub="Corrections members have asked for on their student data."
        />
        <div className="flex flex-wrap gap-3">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`border-4 px-3 py-0.5 text-base transition-colors ${focus} ${
                filter === f
                  ? "border-black bg-pix-butter text-black shadow-pixel-teal-2"
                  : "border-pix-teal text-pix-butter hover:bg-pix-teal hover:text-black"
              }`}
            >
              {f === "pending" ? "Pending" : "History"}
            </button>
          ))}
          <RefreshButton onClick={() => query.refetch()} loading={query.isFetching} />
        </div>
      </div>

      <div className={`mt-3 flex flex-col gap-2 ${requests.length > 3 ? `${SCROLL_AREA} pr-2` : ""}`}>
        {loading && requests.length === 0 && <div className="py-5"><Spinner /></div>}
        {query.error && requests.length === 0 && (
          <p role="alert" className="inline-block self-start border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">{query.error.message}</p>
        )}
        {!loading && requests.length === 0 && (
          <div className={`${BOX} py-5 text-center text-pix-butter/60`}>
            {filter === "pending" ? "No requests waiting for review." : "No requests yet."}
          </div>
        )}

        {requests.map((r) => {
          const fields = EDITABLE_FIELDS.filter((f) => f in r.requested_values);
          const name = r.participant?.display_name ?? r.participant?.supplied_name ?? "Unknown participant";
          const isPending = r.status === "pending";
          const busy = reviewMutation.isPending && reviewMutation.variables?.id === r.request_id;
          return (
            <article key={r.request_id} className={`${BOX} p-3`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base">{name}</p>
                  <p className="break-words text-base text-pix-butter/60">
                    {[r.participant?.member_id, `Student no. ${r.student_number}`, r.participant?.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill text={REQUEST_STATUS_LABELS[r.status]} colorClass={REQUEST_STATUS_COLORS[r.status]} />
                  <span className="text-sm text-pix-butter/55">{fmt(r.created_at)}</span>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-base">
                  <thead>
                    <tr className="border-b-2 border-pix-butter/20">
                      <th scope="col" className="py-1 pr-4 text-left font-normal text-pix-butter/60">Field</th>
                      <th scope="col" className="py-1 pr-4 text-left font-normal text-pix-butter/60">Was</th>
                      <th scope="col" className="py-1 text-left font-normal text-pix-butter/60">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => {
                      const was = r.current_values[f];
                      const live = r.live_values?.[f];
                      // The record may have been edited (by an admin, or an earlier approval) since this was filed.
                      const drifted = isPending && r.live_values !== null && (live ?? "") !== (was ?? "");
                      return (
                        <tr key={f} className="border-b border-pix-butter/10 align-top last:border-0">
                          <td className="py-1 pr-4 text-pix-butter/80">{FIELD_LABELS[f]}</td>
                          <td className="py-1 pr-4 break-words text-pix-butter/60 line-through">{showValue(was)}</td>
                          <td className="py-1 break-words">
                            {showValue(r.requested_values[f])}
                            {drifted && (
                              <span className="mt-1 flex items-center gap-1.5 text-sm text-pix-mustard">
                                <AlertTriangle size={13} aria-hidden="true" />
                                Record now reads &ldquo;{showValue(live)}&rdquo;
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 break-words text-base">
                <span className="text-pix-butter/60">Reason: </span>{r.reason}
              </p>

              {isPending ? (
                <div className="mt-3 flex flex-col gap-2">
                  <label htmlFor={`note-${r.request_id}`} className="text-base text-pix-butter/80">
                    Note to the member <span className="text-pix-butter/50">(required to reject)</span>
                  </label>
                  <input
                    id={`note-${r.request_id}`}
                    type="text"
                    maxLength={500}
                    value={notes[r.request_id] ?? ""}
                    disabled={busy}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.request_id]: e.target.value }))}
                    className={inputCls()}
                    placeholder="e.g. Please bring your COR to the officers so we can verify."
                  />
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={busy} onClick={() => review(r.request_id, "approve")} className={BTN_PRIMARY}>
                      <Check size={14} /> {busy ? "Saving…" : "Approve & apply"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => review(r.request_id, "reject")} className={BTN_SECONDARY}>
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ) : (
                (r.review_note || r.reviewed_at) && (
                  <p className="mt-4 break-words text-base text-pix-butter/70">
                    {r.reviewed_at && <>Reviewed {fmt(r.reviewed_at)}{r.reviewer_name ? ` by ${r.reviewer_name}` : ""}. </>}
                    {r.review_note && <>Note: {r.review_note}</>}
                  </p>
                )
              )}
            </article>
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
  { id: "requests",  label: "Requests",  icon: ClipboardList },
  { id: "provision", label: "Provision", icon: UserCog },
  { id: "roles",     label: "Roles",     icon: ShieldCheck },
];

/** Public entry point: scopes the TanStack Query cache + polling to the admin area. */
export function AdminDashboard({ callerParticipantId }: { callerParticipantId: string }) {
  return (
    <QueryProvider>
      <AdminShell callerParticipantId={callerParticipantId} />
    </QueryProvider>
  );
}

function AdminShell({ callerParticipantId }: { callerParticipantId: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  // Badge on the Requests tab so pending student-data changes don't go unnoticed (polled).
  const { data: pendingRequests = 0 } = usePendingRequestCount();

  // Layout: the page itself scrolls normally (only the admin nav is pinned). Individual long lists
  // — members, events, roles, requests, provisioning rows — scroll inside their own bounded areas.
  const [showTop, setShowTop] = useState(false);

  // Height of the pinned admin nav, so the content area can fill exactly the rest of the viewport.
  const navRef = useRef<HTMLDivElement>(null);
  const [adminNavH, setAdminNavH] = useState(0);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => setAdminNavH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function selectTab(id: Tab) {
    setTab(id);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" contentWidth={1680} />
      <SidePixels side="right" contentWidth={1680} />

      <div className="relative z-10">
        {/* Admin nav — stays pinned just under the site navbar */}
        <div
          ref={navRef}
          className="sticky z-10 bg-black"
          style={{ top: "var(--site-nav-h, 56px)" }}
        >
          <div className={`${wrap} flex items-start gap-3 py-2`}>
            <h1 className="sr-only">Admin</h1>
            {/* Tabs — same shape as the Terms / Privacy switcher */}
            <div role="tablist" aria-label="Admin sections" className="flex min-w-0 flex-1 flex-wrap gap-2">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectTab(id)}
                    className={`flex items-center gap-1.5 border-4 px-2.5 py-0.5 text-base transition-transform ${focus} ${
                      active
                        ? "border-black bg-pix-butter text-black shadow-pixel-teal-2"
                        : "border-pix-teal text-pix-butter hover:bg-pix-teal hover:text-black"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                    {id === "requests" && pendingRequests > 0 && (
                      <span
                        className="border-2 border-pix-rust bg-pix-rust px-1.5 text-sm leading-tight text-pix-butter"
                        aria-label={`${pendingRequests} pending`}
                      >
                        {pendingRequests}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Back to top — fades in once the content below has been scrolled */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              title="Back to top"
              tabIndex={showTop ? 0 : -1}
              className={`flex shrink-0 items-center gap-1.5 border-4 border-pix-butter px-2.5 py-0.5 text-base text-pix-butter transition-all hover:bg-pix-butter hover:text-black ${focus} ${
                showTop ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <ArrowUp size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Top</span>
            </button>
          </div>
        </div>

        {/* Content — flows with the page; no scrollbar of its own */}
        <section
          role="tabpanel"
          style={{ minHeight: `calc(100dvh - var(--site-nav-h, 56px) - ${adminNavH}px)` }}
        >
          <div className={`${wrap} py-3 sm:py-4`}>
            {tab === "overview"  && <OverviewTab />}
            {tab === "members"   && <MembersTab callerParticipantId={callerParticipantId} />}
            {tab === "events"    && <EventsTab />}
            {tab === "requests"  && <RequestsTab />}
            {tab === "provision" && <ProvisionTab />}
            {tab === "roles"     && <RolesTab callerParticipantId={callerParticipantId} />}
          </div>
        </section>

        {/* Closes the admin block so the footer reads as its own section */}
        <Stripes className="h-2" />
      </div>
    </div>
  );
}
