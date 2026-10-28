"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMutating } from "@tanstack/react-query";
import { hd } from "@/src/shared/config/fonts";
import {
  useAddRegistrations, useBulkRegistrationStatus, useDebounced, useEditRegistration,
  usePersonSearch, useRegistrations, useRemoveRegistrations,
} from "../model/queries";
import type { PersonHit, RegistrationRow, RegistrationStatus } from "../model/types";
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, Copy, Download, Loader2, Plus, RefreshCw, Search, Trash2, UserPlus, X,
} from "lucide-react";
import { BOX, BTN_PRIMARY, BTN_SECONDARY, focus, inputCls } from "./styles";

// ─── Registrations sheet ──────────────────────────────────────────────────────
// A spreadsheet-style view of one event's registrations and attendance.
//
//   • Click a cell (or use the arrow keys) to move around; Enter / F2 / double-click edits
//     Affiliation and Note; just start typing to replace a cell.
//   • On the Status column press A (attended), N (no-show) or R (registered) — fast check-in.
//   • Space ticks a row, Shift-click ticks a range, Ctrl/⌘+A ticks everything in view.
//   • Ctrl/⌘+C copies the cell; paste TSV from Google Sheets / Excel into Affiliation, Status or Note.
//   • Click a column header to sort. Search and status chips filter. Copy / CSV export what you see.
//
// Every edit saves immediately (optimistic, rolled back if the server refuses).

type ToastFn = (t: { message: string; type: "success" | "error" }) => void;
type Patch = { status?: RegistrationStatus; affiliation?: string | null; note?: string | null };
type EditKind = "text" | "status";
type StatusFilter = "all" | RegistrationStatus;

interface Col {
  key: keyof RegistrationRow;
  label: string;
  width: number;
  edit?: EditKind;
  /** Frozen next to the row number while scrolling sideways. */
  frozen?: boolean;
  get: (r: RegistrationRow) => string;
  /** Raw value to sort by when it differs from what is shown. */
  sortVal?: (r: RegistrationRow) => string;
  max?: number;
}

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  registered: "Registered",
  attended: "Attended",
  not_attended: "No-show",
};
const STATUS_TEXT: Record<RegistrationStatus, string> = {
  registered: "text-pix-mustard",
  attended: "text-pix-green",
  not_attended: "text-pix-coral",
};
const STATUS_ORDER: RegistrationStatus[] = ["registered", "attended", "not_attended"];
const STATUS_HOTKEY: Record<string, RegistrationStatus> = { r: "registered", a: "attended", n: "not_attended" };

const COLS: Col[] = [
  { key: "name", label: "Name", width: 220, frozen: true, get: (r) => r.name },
  { key: "status", label: "Status", width: 150, edit: "status", get: (r) => STATUS_LABEL[r.status] },
  { key: "affiliation", label: "Affiliation", width: 170, edit: "text", max: 120, get: (r) => r.affiliation ?? "" },
  { key: "memberId", label: "Member ID", width: 130, get: (r) => r.memberId ?? "" },
  { key: "studentNumber", label: "Student no.", width: 130, get: (r) => r.studentNumber ?? "" },
  { key: "email", label: "Email", width: 240, get: (r) => r.email ?? "" },
  { key: "program", label: "Program", width: 150, get: (r) => r.program ?? "" },
  { key: "yearLevel", label: "Year", width: 90, get: (r) => r.yearLevel ?? "" },
  { key: "section", label: "Section", width: 100, get: (r) => r.section ?? "" },
  { key: "note", label: "Note", width: 260, edit: "text", max: 500, get: (r) => r.note ?? "" },
  { key: "registeredAt", label: "Registered", width: 170, get: (r) => stamp(r.registeredAt), sortVal: (r) => r.registeredAt },
];

const CHECK_W = 40;
const NUM_W = 48;
const FROZEN_LEFT = CHECK_W + NUM_W;
const TOTAL_W = FROZEN_LEFT + COLS.reduce((n, c) => n + c.width, 0);
const PAGE = 300;
const MAX_BATCH = 500;

const SHEET_SCROLL =
  "max-h-[min(40rem,70dvh)] overflow-auto overscroll-contain [scrollbar-color:#fff7a1_#000] [scrollbar-width:thin]";

const cellId = (pid: string, col: number) => `rs-${pid}-${col}`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function haystack(r: RegistrationRow) {
  return [
    r.name, r.username, r.email, r.memberId, r.studentNumber, r.program, r.section, r.yearLevel,
    r.affiliation, r.note, STATUS_LABEL[r.status],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Understands what people paste into a status cell: "attended", "Present", "no show", "x"… */
function parseStatus(v: string): RegistrationStatus | null {
  const l = v.trim().toLowerCase();
  if (!l) return null;
  if (/^(not|no\b|absent|x$)/.test(l) || l.includes("no-show") || l.includes("no show") || l.includes("absent")) return "not_attended";
  if (/attend|present|checked|yes|✓|✔/.test(l)) return "attended";
  if (/regist|pending|going/.test(l)) return "registered";
  return null;
}

/** Spreadsheet formula injection: a cell that starts with = + - @ would run when opened in Excel. */
function csvCell(v: string) {
  const t = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

const tsvCell = (v: string) => v.replace(/[\t\r\n]+/g, " ");

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "event";
}

// ─── Inline cell editor ───────────────────────────────────────────────────────

function CellEditor({ initial, seed, max, label, onDone }: {
  initial: string;
  /** Typed character that opened the editor (replaces the content), or null to edit what is there. */
  seed: string | null;
  max: number;
  label: string;
  /** value === null means cancelled. refocus is false when the editor closed because focus moved away. */
  onDone: (value: string | null, move: "down" | "right" | "left" | "none", refocus: boolean) => void;
}) {
  const [draft, setDraft] = useState(seed ?? initial);
  const done = useRef(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (seed === null) el.select();
    else el.setSelectionRange(el.value.length, el.value.length);
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(commit: boolean, move: "down" | "right" | "left" | "none", refocus: boolean) {
    if (done.current) return;
    done.current = true;
    onDone(commit ? draft : null, move, refocus);
  }

  return (
    <input
      ref={ref}
      value={draft}
      maxLength={max}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true, "none", false)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") { e.preventDefault(); finish(true, "down", true); }
        else if (e.key === "Tab") { e.preventDefault(); finish(true, e.shiftKey ? "left" : "right", true); }
        else if (e.key === "Escape") { e.preventDefault(); finish(false, "none", true); }
      }}
      className="block w-full bg-pix-butter px-3 py-1 text-base text-black focus:outline-none"
    />
  );
}

// ─── Add attendees ────────────────────────────────────────────────────────────

function AddAttendees({ eventId, existing, onClose, setToast }: {
  eventId: string;
  existing: Set<string>;
  onClose: () => void;
  setToast: ToastFn;
}) {
  const [q, setQ] = useState("");
  const [as, setAs] = useState<"attended" | "registered">("attended");
  const dq = useDebounced(q).trim();
  const search = usePersonSearch(dq);
  const add = useAddRegistrations(eventId);

  const hits: PersonHit[] = (dq.length >= 2 ? search.data ?? [] : []).filter((h) => !existing.has(h.participantId));

  async function addOne(h: PersonHit) {
    try {
      await add.mutateAsync({ participantIds: [h.participantId], status: as });
      setToast({ message: `${h.displayName || h.suppliedName} added as ${as === "attended" ? "attended" : "registered"}`, type: "success" });
    } catch (e) {
      setToast({ message: errMsg(e), type: "error" });
    }
  }

  return (
    <div className={`${BOX} mt-3 p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base">Add people to this event — walk-ins, late sign-ups, anyone in the directory.</p>
        <button type="button" onClick={onClose} aria-label="Close add attendees" className={`opacity-70 hover:opacity-100 ${focus}`}>
          <X size={18} />
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pix-butter/50" aria-hidden="true" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, username, email, member ID…"
            aria-label="Search people to add"
            autoFocus
            className={`${inputCls()} pl-9`}
          />
        </div>
        <label className="flex items-center gap-2 text-base">
          Add as
          <select
            value={as}
            onChange={(e) => setAs(e.target.value as "attended" | "registered")}
            className={`border-4 border-pix-teal bg-black px-2 py-1 text-base text-pix-butter ${focus}`}
          >
            <option value="attended">Attended</option>
            <option value="registered">Registered</option>
          </select>
        </label>
      </div>

      <div className="mt-2 max-h-64 overflow-auto [scrollbar-color:#fff7a1_#000] [scrollbar-width:thin]">
        {dq.length < 2 && <p className="py-2 text-base text-pix-butter/55">Type at least 2 characters.</p>}
        {dq.length >= 2 && search.isFetching && hits.length === 0 && (
          <p className="flex items-center gap-2 py-2 text-base text-pix-butter/60"><Loader2 size={14} className="animate-spin" /> Searching…</p>
        )}
        {dq.length >= 2 && !search.isFetching && hits.length === 0 && (
          <p className="py-2 text-base text-pix-butter/55">No one new matches — they may already be on the sheet.</p>
        )}
        <ul className="divide-y-2 divide-pix-butter/10">
          {hits.map((h) => {
            const busy = add.isPending && add.variables?.participantIds[0] === h.participantId;
            return (
              <li key={h.participantId} className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-base">{h.displayName || h.suppliedName}</p>
                  <p className="truncate text-sm text-pix-butter/55">
                    {[h.memberId, h.email].filter(Boolean).join(" · ") || "No member ID or email"}
                  </p>
                </div>
                <button type="button" onClick={() => addOne(h)} disabled={busy} className={`${BTN_SECONDARY} !py-0.5`}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─── The sheet ────────────────────────────────────────────────────────────────

export function RegistrationSheet({ eventId, onBack, setToast }: {
  eventId: string;
  onBack: () => void;
  setToast: ToastFn;
}) {
  const query = useRegistrations(eventId);
  const editMut = useEditRegistration(eventId);
  const bulkMut = useBulkRegistrationStatus(eventId);
  const removeMut = useRemoveRegistrations(eventId);
  const saving = useIsMutating() > 0;

  const rows = useMemo(() => query.data?.rows ?? [], [query.data]);
  const event = query.data?.event;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<{ key: keyof RegistrationRow; dir: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<{ pid: string; col: number } | null>(null);
  const [editing, setEditing] = useState<{ seed: string | null } | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const gridRef = useRef<HTMLTableElement>(null);
  const lastTick = useRef<number | null>(null);

  const rowMap = useMemo(() => new Map(rows.map((r) => [r.participantId, r])), [rows]);

  const counts = useMemo(() => {
    const c = { registered: 0, attended: 0, not_attended: 0 };
    for (const r of rows) c[r.status] += 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => haystack(r).includes(q));
    if (sort) {
      const col = COLS.find((c) => c.key === sort.key);
      if (col) {
        const val = col.sortVal ?? col.get;
        const dir = sort.dir === "asc" ? 1 : -1;
        list = [...list].sort((a, b) => dir * val(a).localeCompare(val(b), undefined, { numeric: true, sensitivity: "base" }));
      }
    }
    return list;
  }, [rows, statusFilter, search, sort]);

  const shown = useMemo(() => visible.slice(0, limit), [visible, limit]);
  const activeRow = active ? shown.findIndex((r) => r.participantId === active.pid) : -1;
  const selectedIds = useMemo(() => rows.filter((r) => selected.has(r.participantId)).map((r) => r.participantId), [rows, selected]);
  const allVisibleTicked = visible.length > 0 && visible.every((r) => selected.has(r.participantId));
  const someVisibleTicked = visible.some((r) => selected.has(r.participantId));

  // The row under the cursor was removed (here or by someone else) — drop the cursor.
  useEffect(() => {
    if (active && !rowMap.has(active.pid)) { setActive(null); setEditing(null); }
  }, [active, rowMap]);

  // Keep the active cell in view (scroll-margin on cells keeps it clear of the frozen header/columns).
  useEffect(() => {
    if (!active) return;
    document.getElementById(cellId(active.pid, active.col))?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  // ── helpers ────────────────────────────────────────────────────────────────

  function focusGrid() {
    requestAnimationFrame(() => gridRef.current?.focus({ preventScroll: true }));
  }

  async function save(pid: string, patch: Patch) {
    try {
      await editMut.mutateAsync({ participantId: pid, patch });
    } catch (e) {
      setToast({ message: errMsg(e), type: "error" });
    }
  }

  function moveTo(rowIdx: number, colIdx: number) {
    if (visible.length === 0) return;
    const r = Math.min(Math.max(rowIdx, 0), visible.length - 1);
    const c = Math.min(Math.max(colIdx, 0), COLS.length - 1);
    if (r >= limit) setLimit(r + PAGE / 3);
    setActive({ pid: visible[r].participantId, col: c });
  }

  function toggleSort(key: keyof RegistrationRow) {
    setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  }

  function tick(pid: string, idx: number, range: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (range && lastTick.current !== null) {
        const [a, b] = [lastTick.current, idx].sort((x, y) => x - y);
        const on = !prev.has(pid);
        for (let i = a; i <= b; i++) {
          const id = shown[i]?.participantId;
          if (!id) continue;
          if (on) next.add(id); else next.delete(id);
        }
      } else if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
    lastTick.current = idx;
  }

  function tickAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleTicked) visible.forEach((r) => next.delete(r.participantId));
      else visible.forEach((r) => next.add(r.participantId));
      return next;
    });
  }

  function finishEdit(value: string | null, move: "down" | "right" | "left" | "none", refocus: boolean) {
    const a = active;
    setEditing(null);
    if (a) {
      const col = COLS[a.col];
      const row = rowMap.get(a.pid);
      if (value !== null && row && (col.key === "affiliation" || col.key === "note")) {
        const t = value.trim();
        const next = t === "" ? null : t;
        if (next !== (row[col.key] ?? null)) {
          void save(a.pid, col.key === "note" ? { note: next } : { affiliation: next });
        }
      }
      if (move === "down") moveTo(activeRow + 1, a.col);
      else if (move === "right") moveTo(activeRow, a.col + 1);
      else if (move === "left") moveTo(activeRow, a.col - 1);
    }
    if (refocus) focusGrid();
  }

  async function bulkStatus(status: RegistrationStatus) {
    if (selectedIds.length === 0) return;
    try {
      for (const ids of chunk(selectedIds, MAX_BATCH)) await bulkMut.mutateAsync({ participantIds: ids, status });
      setToast({ message: `${selectedIds.length} marked ${STATUS_LABEL[status].toLowerCase()}`, type: "success" });
      setSelected(new Set());
    } catch (e) {
      setToast({ message: errMsg(e), type: "error" });
    }
  }

  async function removeSelected() {
    if (selectedIds.length === 0) return;
    try {
      for (const ids of chunk(selectedIds, MAX_BATCH)) await removeMut.mutateAsync(ids);
      setToast({ message: `${selectedIds.length} removed from this event`, type: "success" });
      setSelected(new Set());
    } catch (e) {
      setToast({ message: errMsg(e), type: "error" });
    } finally {
      setConfirmRemove(false);
    }
  }

  async function writeClipboard(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: done, type: "success" });
    } catch {
      setToast({ message: "Couldn't access the clipboard", type: "error" });
    }
  }

  function copyView() {
    const lines = [
      COLS.map((c) => c.label).join("\t"),
      ...visible.map((r) => COLS.map((c) => tsvCell(c.get(r))).join("\t")),
    ];
    void writeClipboard(lines.join("\n"), `Copied ${visible.length} row${visible.length === 1 ? "" : "s"} — paste into Sheets or Excel`);
  }

  function downloadCsv() {
    const lines = [
      COLS.map((c) => csvCell(c.label)).join(","),
      ...visible.map((r) => COLS.map((c) => csvCell(c.get(r))).join(",")),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(event?.name ?? "event")}-registrations.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── keyboard + paste ───────────────────────────────────────────────────────

  function onGridKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    if (e.target !== e.currentTarget || editing) return; // inputs, selects and checkboxes handle their own keys
    const meta = e.ctrlKey || e.metaKey;
    const ci = active?.col ?? 0;
    const ri = activeRow < 0 ? 0 : activeRow;

    if (meta) {
      const k = e.key.toLowerCase();
      if (k === "a") {
        e.preventDefault();
        setSelected(new Set(visible.map((r) => r.participantId)));
      } else if (k === "c" && active) {
        const row = rowMap.get(active.pid);
        if (row) { e.preventDefault(); void writeClipboard(COLS[active.col].get(row), "Cell copied"); }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": e.preventDefault(); moveTo(active ? ri + 1 : 0, ci); return;
      case "ArrowUp": e.preventDefault(); moveTo(active ? ri - 1 : 0, ci); return;
      case "ArrowLeft": e.preventDefault(); moveTo(ri, ci - 1); return;
      case "ArrowRight": e.preventDefault(); moveTo(ri, ci + 1); return;
      case "Home": e.preventDefault(); moveTo(ri, 0); return;
      case "End": e.preventDefault(); moveTo(ri, COLS.length - 1); return;
      case "PageDown": e.preventDefault(); moveTo(ri + 10, ci); return;
      case "PageUp": e.preventDefault(); moveTo(ri - 10, ci); return;
      case "Escape": setSelected(new Set()); setConfirmRemove(false); return;
      default: break;
    }

    if (!active) return;
    const col = COLS[active.col];

    if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      if (col.edit === "text") setEditing({ seed: null });
      else if (e.key === "Enter") moveTo(ri + 1, ci);
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      tick(active.pid, ri, false);
      return;
    }
    if ((e.key === "Delete" || e.key === "Backspace") && col.edit === "text") {
      e.preventDefault();
      void save(active.pid, col.key === "note" ? { note: null } : { affiliation: null });
      return;
    }
    if (col.edit === "status") {
      const st = STATUS_HOTKEY[e.key.toLowerCase()];
      if (st && !e.altKey) {
        e.preventDefault();
        const row = rowMap.get(active.pid);
        if (row && row.status !== st) void save(active.pid, { status: st });
      }
      return;
    }
    if (col.edit === "text" && e.key.length === 1 && !e.altKey) {
      e.preventDefault();
      setEditing({ seed: e.key });
    }
  }

  async function onGridPaste(e: React.ClipboardEvent<HTMLTableElement>) {
    if (e.target !== e.currentTarget || editing || !active || activeRow < 0) return;
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    e.preventDefault();

    const lines = text.replace(/\r/g, "").split("\n");
    if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();

    const patches = new Map<string, Patch>();
    lines.slice(0, 200).forEach((line, i) => {
      const row = visible[activeRow + i];
      if (!row) return;
      line.split("\t").forEach((raw, j) => {
        const col = COLS[active.col + j];
        if (!col?.edit) return;
        const v = raw.trim();
        const patch = patches.get(row.participantId) ?? {};
        if (col.edit === "status") {
          const st = parseStatus(v);
          if (!st || st === row.status) return;
          patch.status = st;
        } else {
          const next = v === "" ? null : v.slice(0, col.max ?? 500);
          if (next === (row[col.key as "affiliation" | "note"] ?? null)) return;
          if (col.key === "note") patch.note = next; else patch.affiliation = next;
        }
        patches.set(row.participantId, patch);
      });
    });

    if (patches.size === 0) {
      setToast({ message: "Nothing to paste — pick an Affiliation, Status or Note cell first", type: "error" });
      return;
    }
    const results = await Promise.allSettled(
      [...patches].map(([participantId, patch]) => editMut.mutateAsync({ participantId, patch })),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setToast(
      failed === 0
        ? { message: `Pasted into ${patches.size} row${patches.size === 1 ? "" : "s"}`, type: "success" }
        : { message: `${failed} of ${patches.size} rows couldn't be saved`, type: "error" },
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────

  const going = counts.registered + counts.attended;
  const rate = going > 0 ? `${Math.round((counts.attended / going) * 100)}%` : "—";
  const capacity = event?.capacity ?? null;
  const subtitle = event
    ? [
        new Date(event.starts_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }),
        event.location,
      ].filter(Boolean).join(" · ")
    : "";

  const tiles: { label: string; value: string; tone: string }[] = [
    { label: "Going", value: capacity ? `${going} / ${capacity}` : String(going), tone: "border-pix-teal shadow-pixel-teal-3" },
    { label: "Attended", value: String(counts.attended), tone: "border-pix-green shadow-pixel-green-3" },
    { label: "Awaiting", value: String(counts.registered), tone: "border-pix-mustard shadow-pixel-mustard-3" },
    { label: "No-show", value: String(counts.not_attended), tone: "border-pix-rust shadow-pixel-rust-3" },
    { label: "Checked in", value: rate, tone: "border-pix-teal shadow-pixel-teal-3" },
  ];

  const chips: { id: StatusFilter; label: string; n: number }[] = [
    { id: "all", label: "All", n: rows.length },
    ...STATUS_ORDER.map((s) => ({ id: s as StatusFilter, label: STATUS_LABEL[s], n: counts[s] })),
  ];

  const busy = bulkMut.isPending || removeMut.isPending;

  return (
    <div>
      <button type="button" onClick={onBack} className={`inline-flex items-center gap-1 text-base text-pix-butter/70 hover:text-pix-butter ${focus}`}>
        <ChevronLeft size={16} aria-hidden="true" /> Back to events
      </button>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className={`${hd} break-words text-2xl sm:text-3xl`}>{event?.name ?? "Registrations"}</h2>
          {subtitle && <p className="text-sm text-pix-butter/70">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-pix-butter/60" aria-live="polite">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Check size={14} /> Saved</>}
          </span>
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className={BTN_SECONDARY}>
            <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} /> Refresh
          </button>
          <button type="button" onClick={() => setShowAdd((v) => !v)} aria-expanded={showAdd} className={BTN_PRIMARY}>
            <UserPlus size={14} /> Add attendees
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className={`border-4 bg-black px-3 py-1.5 ${t.tone}`}>
            <p className="text-sm text-pix-butter/70">{t.label}</p>
            <p className={`${hd} text-2xl tabular-nums`}>{query.data ? t.value : "—"}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <AddAttendees
          eventId={eventId}
          existing={new Set(rows.map((r) => r.participantId))}
          onClose={() => setShowAdd(false)}
          setToast={setToast}
        />
      )}

      <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => {
            const on = statusFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => setStatusFilter(c.id)}
                className={`border-4 px-3 py-0.5 text-base transition-colors ${focus} ${
                  on ? "border-black bg-pix-butter text-black shadow-pixel-teal-3" : "border-pix-teal hover:bg-pix-teal hover:text-black"
                }`}
              >
                {c.label} <span className="tabular-nums opacity-70">{c.n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pix-butter/50" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter this sheet…"
              aria-label="Filter this sheet"
              className={`${inputCls()} pl-9`}
            />
          </div>
          <button type="button" onClick={copyView} disabled={visible.length === 0} className={BTN_SECONDARY} title="Copy the rows in view as tab-separated text">
            <Copy size={14} /> Copy
          </button>
          <button type="button" onClick={downloadCsv} disabled={visible.length === 0} className={BTN_SECONDARY} title="Download the rows in view as CSV">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div role="toolbar" aria-label="Bulk actions" className="mt-3 flex flex-wrap items-center gap-2 border-4 border-pix-butter bg-black px-3 py-1.5">
          <span className="mr-1 text-base tabular-nums">{selectedIds.length} selected</span>
          <button type="button" disabled={busy} onClick={() => bulkStatus("attended")} className={`${BTN_SECONDARY} !py-0.5`}>Mark attended</button>
          <button type="button" disabled={busy} onClick={() => bulkStatus("not_attended")} className={`${BTN_SECONDARY} !py-0.5`}>Mark no-show</button>
          <button type="button" disabled={busy} onClick={() => bulkStatus("registered")} className={`${BTN_SECONDARY} !py-0.5`}>Reset to registered</button>
          {confirmRemove ? (
            <span className="flex items-center gap-2">
              <span className="text-base text-pix-coral">Remove {selectedIds.length} from this event?</span>
              <button type="button" disabled={busy} onClick={removeSelected} className="inline-flex items-center gap-1 border-4 border-pix-rust bg-pix-rust px-3 py-0.5 text-base text-pix-butter disabled:opacity-50">
                {removeMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Yes, remove
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)} className={`${BTN_SECONDARY} !py-0.5`}>Cancel</button>
            </span>
          ) : (
            <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1 border-4 border-pix-rust px-3 py-0.5 text-base text-pix-coral transition-colors hover:bg-pix-rust hover:text-pix-butter disabled:opacity-40">
              <Trash2 size={14} /> Remove
            </button>
          )}
          <button type="button" onClick={() => { setSelected(new Set()); setConfirmRemove(false); }} className="ml-auto text-base text-pix-butter/70 underline-offset-2 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      {query.isLoading ? (
        <div className={`${BOX} mt-3 flex items-center justify-center gap-2 py-10 text-base text-pix-butter/70`}>
          <Loader2 size={18} className="animate-spin" /> Loading registrations…
        </div>
      ) : query.error && !query.data ? (
        <p role="alert" className="mt-3 inline-block border-4 border-pix-rust bg-pix-rust px-3 py-1 text-base">
          {query.error.message}
        </p>
      ) : (
        <div className={`${BOX} mt-3 ${SHEET_SCROLL}`}>
          <table
            ref={gridRef}
            role="grid"
            tabIndex={0}
            aria-label={`Registrations for ${event?.name ?? "this event"}`}
            aria-rowcount={visible.length + 1}
            aria-colcount={COLS.length + 2}
            aria-multiselectable="true"
            aria-activedescendant={active ? cellId(active.pid, active.col) : undefined}
            onKeyDown={onGridKeyDown}
            onPaste={onGridPaste}
            onFocus={(e) => {
              if (e.target !== e.currentTarget) return;
              // Functional update: a click sets `active` in the same batch and must win over this default.
              setActive((a) => a ?? (shown[0] ? { pid: shown[0].participantId, col: 0 } : null));
            }}
            style={{ width: TOTAL_W, minWidth: "100%" }}
            className="table-fixed border-separate border-spacing-0 text-base focus:outline-none focus-visible:outline-none"
          >
            <colgroup>
              <col style={{ width: CHECK_W }} />
              <col style={{ width: NUM_W }} />
              {COLS.map((c) => <col key={c.key} style={{ width: c.width }} />)}
            </colgroup>

            <thead>
              <tr role="row" aria-rowindex={1}>
                <th
                  role="columnheader"
                  style={{ left: 0 }}
                  className="sticky top-0 z-30 border-b-4 border-pix-teal bg-black px-0 py-1 text-center font-normal"
                >
                  <input
                    type="checkbox"
                    checked={allVisibleTicked}
                    ref={(el) => { if (el) el.indeterminate = someVisibleTicked && !allVisibleTicked; }}
                    onChange={tickAllVisible}
                    disabled={visible.length === 0}
                    aria-label="Select all rows in view"
                    className="h-4 w-4 accent-pix-teal"
                  />
                </th>
                <th
                  role="columnheader"
                  style={{ left: CHECK_W }}
                  className="sticky top-0 z-30 border-b-4 border-pix-teal bg-black px-2 py-1 text-right text-sm font-normal text-pix-butter/45"
                >
                  #
                </th>
                {COLS.map((c) => {
                  const sorted = sort?.key === c.key ? sort.dir : null;
                  return (
                    <th
                      key={c.key}
                      role="columnheader"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      style={c.frozen ? { left: FROZEN_LEFT } : undefined}
                      className={`sticky top-0 border-b-4 border-pix-teal bg-black p-0 text-left font-normal ${
                        c.frozen ? "z-30 border-r-2 border-r-pix-teal/60" : "z-20"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`flex w-full items-center gap-1 px-3 py-1 text-left text-base text-pix-butter/60 hover:text-pix-butter ${focus}`}
                      >
                        <span className="truncate">{c.label}</span>
                        {c.edit && <span aria-hidden="true" className="text-pix-teal">✎</span>}
                        {sorted === "asc" && <ArrowUp size={14} aria-hidden="true" />}
                        {sorted === "desc" && <ArrowDown size={14} aria-hidden="true" />}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={COLS.length + 2} className="px-3 py-8 text-center text-pix-butter/60">
                    {rows.length === 0
                      ? "No one has registered for this event yet. Use “Add attendees” to add people by hand."
                      : "Nothing matches the current filter."}
                  </td>
                </tr>
              )}

              {shown.map((r, ri) => {
                const pid = r.participantId;
                const isTicked = selected.has(pid);
                const rowBg = isTicked ? "bg-[#191810]" : "bg-black";
                return (
                  <tr key={pid} role="row" aria-rowindex={ri + 2} aria-selected={isTicked} className="group">
                    <td
                      role="gridcell"
                      style={{ left: 0 }}
                      className={`sticky z-10 border-b-2 border-pix-butter/15 px-0 text-center ${rowBg}`}
                    >
                      <input
                        type="checkbox"
                        checked={isTicked}
                        onChange={() => undefined}
                        onClick={(e) => tick(pid, ri, e.shiftKey)}
                        aria-label={`Select ${r.name}`}
                        className="h-4 w-4 accent-pix-teal"
                      />
                    </td>
                    <td
                      role="rowheader"
                      style={{ left: CHECK_W }}
                      className={`sticky z-10 border-b-2 border-pix-butter/15 px-2 text-right text-sm tabular-nums text-pix-butter/40 ${rowBg}`}
                    >
                      {ri + 1}
                    </td>

                    {COLS.map((c, ci) => {
                      const isActive = !!active && active.pid === pid && active.col === ci;
                      const isEditing = isActive && editing !== null && c.edit === "text";
                      const value = c.get(r);
                      return (
                        <td
                          key={c.key}
                          id={cellId(pid, ci)}
                          role="gridcell"
                          aria-selected={isActive}
                          style={c.frozen ? { left: FROZEN_LEFT } : undefined}
                          onClick={(e) => {
                            setActive({ pid, col: ci });
                            if (!(e.target as HTMLElement).closest("select,input,button")) {
                              gridRef.current?.focus({ preventScroll: true });
                            }
                          }}
                          onDoubleClick={() => { if (c.edit === "text") setEditing({ seed: null }); }}
                          className={[
                            "scroll-mt-10 border-b-2 border-pix-butter/15 p-0 align-middle",
                            c.frozen ? `sticky z-10 border-r-2 border-r-pix-teal/60 ${rowBg}` : isTicked ? "bg-pix-butter/10" : "group-hover:bg-pix-butter/5",
                            c.frozen ? "" : "scroll-ml-[20rem]",
                            isActive ? "outline outline-2 -outline-offset-2 outline-pix-teal" : "",
                            isActive && !c.frozen && !isEditing ? "bg-pix-teal/15" : "",
                          ].join(" ")}
                        >
                          {isEditing ? (
                            <CellEditor
                              initial={value}
                              seed={editing?.seed ?? null}
                              max={c.max ?? 500}
                              label={`${c.label} for ${r.name}`}
                              onDone={finishEdit}
                            />
                          ) : c.edit === "status" ? (
                            <select
                              value={r.status}
                              onChange={(e) => { void save(pid, { status: e.target.value as RegistrationStatus }); focusGrid(); }}
                              aria-label={`Status for ${r.name}`}
                              className={`block w-full cursor-pointer bg-transparent px-3 py-1 text-base focus:outline-none ${STATUS_TEXT[r.status]}`}
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s} className="bg-black text-pix-butter">{STATUS_LABEL[s]}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="truncate px-3 py-1" title={value || undefined}>
                              {value}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {visible.length > shown.length && (
                <tr>
                  <td colSpan={COLS.length + 2} className="px-3 py-2 text-center">
                    <button type="button" onClick={() => setLimit((l) => l + PAGE)} className={BTN_SECONDARY}>
                      Show {Math.min(PAGE, visible.length - shown.length)} more ({visible.length - shown.length} hidden)
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-sm text-pix-butter/55">
        Click the sheet, then <kbd>↑ ↓ ← →</kbd> move · <kbd>Enter</kbd>/<kbd>F2</kbd> or just type to edit ✎ columns · on Status press{" "}
        <kbd>A</kbd> attended, <kbd>N</kbd> no-show, <kbd>R</kbd> registered · <kbd>Space</kbd> ticks a row (Shift-click for a range) ·{" "}
        <kbd>Ctrl/⌘+C</kbd> copies a cell · paste from Sheets into ✎ columns. Edits save automatically.
        {visible.length !== rows.length && ` Showing ${visible.length} of ${rows.length} rows.`}
      </p>
    </div>
  );
}
