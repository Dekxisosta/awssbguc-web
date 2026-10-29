"use client";

import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AuditEntry, ChangeRequestRow, EventRow, MemberRow, PendingMembersResponse,
  PersonDetail, PersonHit, PersonRow, RegistrationRow, RegistrationSheetData, RegistrationStatus, Stats,
} from "./types";

// ─── Fetch helper ─────────────────────────────────────────────────────────────

/** JSON fetch that throws an Error carrying the server's `error` message on any non-2xx response. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed (HTTP ${res.status}).`);
  }
  return data as T;
}

// ─── Polling intervals ────────────────────────────────────────────────────────
// Polling pauses automatically while the browser tab is hidden (refetchIntervalInBackground is
// false by default) and catches up on focus.

export const POLL = {
  stats: 30_000,
  people: 30_000,
  person: 15_000,
  events: 20_000,
  requests: 15_000,
  provision: 60_000,
  roles: 30_000,
  registrations: 15_000,
  audit: 30_000,
} as const;

// ─── Query keys ───────────────────────────────────────────────────────────────

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => ["admin", "stats"] as const,
  people: () => ["admin", "people"] as const,
  peoplePage: (page: number, filter: string, q: string) => ["admin", "people", { page, filter, q }] as const,
  person: (id: string) => ["admin", "person", id] as const,
  events: () => ["admin", "events"] as const,
  registrations: (eventId: string) => ["admin", "registrations", eventId] as const,
  requests: () => ["admin", "requests"] as const,
  requestList: (status: "pending" | "all") => ["admin", "requests", "list", status] as const,
  requestCount: () => ["admin", "requests", "count"] as const,
  provision: () => ["admin", "provision", "pending"] as const,
  roleSearch: (q: string) => ["admin", "role-search", q] as const,
  audit: (page: number, filter: string, q: string) => ["admin", "audit", { page, filter, q }] as const,
};

// ─── Small utilities ──────────────────────────────────────────────────────────

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => api<Stats>("/api/admin/stats"),
    refetchInterval: POLL.stats,
  });
}

interface PeopleResponse { people: PersonRow[]; total: number; totalPages: number }

export function usePeople(page: number, filter: string, q: string) {
  return useQuery({
    queryKey: adminKeys.peoplePage(page, filter, q),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), filter });
      if (q) params.set("q", q);
      return api<PeopleResponse>(`/api/admin/people?${params}`);
    },
    // Keep showing the previous page/filter while the next one loads — no flicker.
    placeholderData: keepPreviousData,
    refetchInterval: POLL.people,
  });
}

export function usePerson(participantId: string) {
  return useQuery({
    queryKey: adminKeys.person(participantId),
    queryFn: () => api<PersonDetail>(`/api/admin/people/${participantId}`),
    refetchInterval: POLL.person,
  });
}

interface AuditResponse { entries: AuditEntry[]; total: number; totalPages: number }

export function useAuditLog(page: number, filter: string, q: string) {
  return useQuery({
    queryKey: adminKeys.audit(page, filter, q),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), filter });
      if (q) params.set("q", q);
      return api<AuditResponse>(`/api/admin/audit?${params}`);
    },
    placeholderData: keepPreviousData,
    refetchInterval: POLL.audit,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: adminKeys.events(),
    queryFn: async () => (await api<{ events: EventRow[] }>("/api/admin/events")).events,
    refetchInterval: POLL.events,
  });
}

interface RequestsResponse { requests: ChangeRequestRow[]; pendingCount: number }

export function useRequests(status: "pending" | "all") {
  return useQuery({
    queryKey: adminKeys.requestList(status),
    queryFn: () => api<RequestsResponse>(`/api/admin/student-data-requests?status=${status}`),
    placeholderData: keepPreviousData,
    refetchInterval: POLL.requests,
  });
}

/** Lightweight count for the badge on the Requests tab; polled for the whole life of the dashboard. */
export function usePendingRequestCount() {
  return useQuery({
    queryKey: adminKeys.requestCount(),
    queryFn: async () =>
      (await api<RequestsResponse>("/api/admin/student-data-requests?status=pending&limit=1")).pendingCount,
    refetchInterval: POLL.requests,
  });
}

export function useProvisionPending(paused = false) {
  return useQuery({
    queryKey: adminKeys.provision(),
    queryFn: () => api<PendingMembersResponse>("/api/admin/provision/pending"),
    // Don't refetch under the admin's feet while a provisioning batch is running.
    refetchInterval: paused ? false : POLL.provision,
  });
}

export function useRoleSearch(q: string) {
  return useQuery({
    queryKey: adminKeys.roleSearch(q),
    queryFn: async () => {
      const d = await api<{ members: MemberRow[] }>(`/api/admin/members?q=${encodeURIComponent(q)}&page=1`);
      return d.members.filter((m) => !!m.user_id);
    },
    enabled: q.length > 0,
    refetchInterval: POLL.roles,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, role, has }: { participantId: string; role: string; has: boolean }) =>
      api<{ success: true }>("/api/admin/roles", {
        method: has ? "DELETE" : "POST",
        body: JSON.stringify({ participant_id: participantId, role_name: role }),
      }),
    onSuccess: (_d, { participantId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.person(participantId) });
      qc.invalidateQueries({ queryKey: adminKeys.people() });
      qc.invalidateQueries({ queryKey: ["admin", "role-search"] });
    },
  });
}

export interface ReissueResponse {
  success: true;
  email: string | null;
  /** null when the password was emailed; shown to the admin only when it wasn't */
  temporaryPassword: string | null;
  mail: { requested: boolean; configured: boolean; sent: string[]; failed: { memberId: string; reason: string }[] };
}

export function useReissuePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, sendEmail }: { participantId: string; sendEmail: boolean }) =>
      api<ReissueResponse>("/api/admin/provision/reissue", {
        method: "POST",
        body: JSON.stringify({ participantId, sendEmail }),
      }),
    onSuccess: (_d, { participantId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.person(participantId) });
      qc.invalidateQueries({ queryKey: adminKeys.people() });
    },
  });
}

export function useUpdateEventStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      api<{ success: true }>("/api/admin/events", {
        method: "PATCH",
        body: JSON.stringify({ event_id: eventId, status }),
      }),
    // Optimistic: the select and status pill flip immediately, and roll back if the server refuses.
    onMutate: async ({ eventId, status }) => {
      await qc.cancelQueries({ queryKey: adminKeys.events() });
      const previous = qc.getQueryData<EventRow[]>(adminKeys.events());
      qc.setQueryData<EventRow[]>(adminKeys.events(), (old) =>
        old?.map((e) => (e.event_id === eventId ? { ...e, status: status as EventRow["status"] } : e)),
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(adminKeys.events(), ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.events() });
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<{ success: true }>("/api/admin/events", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.events() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

/** PATCH any subset of an event's fields (the full edit form sends all of them). */
export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown> & { event_id: string }) =>
      api<{ success: true }>("/api/admin/events", { method: "PATCH", body: JSON.stringify(body) }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.events() });
    },
  });
}

/** Permanently deletes an event; its registrations cascade and an uploaded cover is removed server-side. */
export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      api<{ success: true }>("/api/admin/events", { method: "DELETE", body: JSON.stringify({ event_id: eventId }) }),
    onSuccess: (_d, eventId) => {
      qc.invalidateQueries({ queryKey: adminKeys.events() });
      qc.invalidateQueries({ queryKey: adminKeys.stats() });
      qc.invalidateQueries({ queryKey: adminKeys.people() }); // per-person registration counts change
      qc.removeQueries({ queryKey: adminKeys.registrations(eventId) });
    },
  });
}

/** Uploads a cover image to the public event-covers bucket and returns its URL. */
export async function uploadEventCover(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/admin/events/cover", { method: "POST", body: form });
  const data = await res.json().catch(() => ({} as { error?: string; url?: string }));
  if (!res.ok || !data.url) throw new Error(data.error ?? `Upload failed (HTTP ${res.status}).`);
  return data.url as string;
}

export function useReviewRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "approve" | "reject"; note: string }) =>
      api<{ success?: true }>(`/api/admin/student-data-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, note }),
      }),
    // Success or failure (a 409 means someone else already decided), the queue is stale.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.requests() });
      qc.invalidateQueries({ queryKey: adminKeys.people() }); // an approval edits the student record
    },
  });
}

/** Call after accounts are created, so every view that counts or lists accounts catches up. */
export function useInvalidateAfterProvision() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: adminKeys.provision() }),
      qc.invalidateQueries({ queryKey: adminKeys.people() }),
      qc.invalidateQueries({ queryKey: adminKeys.stats() }),
    ]);
}

// ─── Registrations sheet ──────────────────────────────────────────────────────

const regUrl = (eventId: string) => `/api/admin/events/${eventId}/registrations`;

export function useRegistrations(eventId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: adminKeys.registrations(eventId),
    queryFn: () => api<RegistrationSheetData>(regUrl(eventId)),
    // Don't poll while an edit is in flight: a refetch landing mid-save would flash the old value.
    refetchInterval: () => (qc.isMutating() > 0 ? false : POLL.registrations),
  });
}

/** Directory search used by "Add attendees" — people matching a name, username, email or ID. */
export function usePersonSearch(q: string) {
  return useQuery({
    queryKey: ["admin", "person-search", q] as const,
    queryFn: async (): Promise<PersonHit[]> => {
      const d = await api<{ people: PersonRow[] }>(`/api/admin/people?page=1&filter=all&q=${encodeURIComponent(q)}`);
      return d.people.map((p) => ({
        participantId: p.participantId,
        displayName: p.displayName,
        suppliedName: p.suppliedName,
        email: p.email,
        memberId: p.memberId,
      }));
    },
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
}

/** Counts shown on the Events tab, the overview, and each person's history all depend on this sheet. */
function useRegistrationInvalidator(eventId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.registrations(eventId) });
    qc.invalidateQueries({ queryKey: adminKeys.events() });
    qc.invalidateQueries({ queryKey: adminKeys.people() });
    qc.invalidateQueries({ queryKey: ["admin", "person"] });
    qc.invalidateQueries({ queryKey: adminKeys.stats() });
  };
}

type RegPatch = Partial<Pick<RegistrationRow, "status" | "affiliation" | "note">>;

/** Optimistic cell edit: the grid updates instantly and rolls back if the server refuses. */
export function useEditRegistration(eventId: string) {
  const qc = useQueryClient();
  const invalidate = useRegistrationInvalidator(eventId);
  const key = adminKeys.registrations(eventId);
  return useMutation({
    mutationFn: ({ participantId, patch }: { participantId: string; patch: RegPatch }) =>
      api<{ success: true }>(regUrl(eventId), {
        method: "PATCH",
        body: JSON.stringify({ participant_id: participantId, ...patch }),
      }),
    onMutate: async ({ participantId, patch }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RegistrationSheetData>(key);
      qc.setQueryData<RegistrationSheetData>(key, (old) =>
        old && { ...old, rows: old.rows.map((r) => (r.participantId === participantId ? { ...r, ...patch } : r)) },
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: invalidate,
  });
}

export function useBulkRegistrationStatus(eventId: string) {
  const qc = useQueryClient();
  const invalidate = useRegistrationInvalidator(eventId);
  const key = adminKeys.registrations(eventId);
  return useMutation({
    mutationFn: ({ participantIds, status }: { participantIds: string[]; status: RegistrationStatus }) =>
      api<{ success: true }>(regUrl(eventId), {
        method: "PATCH",
        body: JSON.stringify({ participant_ids: participantIds, status }),
      }),
    onMutate: async ({ participantIds, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RegistrationSheetData>(key);
      const ids = new Set(participantIds);
      qc.setQueryData<RegistrationSheetData>(key, (old) =>
        old && { ...old, rows: old.rows.map((r) => (ids.has(r.participantId) ? { ...r, status } : r)) },
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: invalidate,
  });
}

export function useAddRegistrations(eventId: string) {
  const invalidate = useRegistrationInvalidator(eventId);
  return useMutation({
    mutationFn: ({ participantIds, status }: { participantIds: string[]; status: "registered" | "attended" }) =>
      api<{ success: true; added: number; skipped: number }>(regUrl(eventId), {
        method: "POST",
        body: JSON.stringify({ participant_ids: participantIds, status }),
      }),
    onSettled: invalidate,
  });
}

export function useRemoveRegistrations(eventId: string) {
  const qc = useQueryClient();
  const invalidate = useRegistrationInvalidator(eventId);
  const key = adminKeys.registrations(eventId);
  return useMutation({
    mutationFn: (participantIds: string[]) =>
      api<{ success: true }>(regUrl(eventId), {
        method: "DELETE",
        body: JSON.stringify({ participant_ids: participantIds }),
      }),
    onMutate: async (participantIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RegistrationSheetData>(key);
      const ids = new Set(participantIds);
      qc.setQueryData<RegistrationSheetData>(key, (old) =>
        old && { ...old, rows: old.rows.filter((r) => !ids.has(r.participantId)) },
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: invalidate,
  });
}
