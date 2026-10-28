"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Modal } from "@/src/features/profile-edit/ui/Modal";
import { darkBanner, darkHint, darkOutline, darkSubmit } from "@/src/shared/ui/pixel-form-dark";
import type { MembershipRow } from "@/src/entities/member";
import {
  EDITABLE_FIELDS,
  FIELD_LABELS,
  fullName,
  type ChangeRequest,
  type ChangeRequestStatus,
  type StudentExtras,
  type StudentValues,
} from "@/src/entities/student-data";
import { ChangeRequestForm } from "./ChangeRequestForm";

const dt = "text-sm uppercase tracking-wide text-pix-butter/70";
const dd = "mt-1 break-words text-lg";

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Withdrawn",
};
const STATUS_COLOR: Record<ChangeRequestStatus, string> = {
  pending: "border-pix-mustard text-pix-mustard",
  approved: "border-pix-green bg-pix-green text-black",
  rejected: "border-pix-rust bg-pix-rust text-pix-butter",
  cancelled: "border-pix-butter/50 text-pix-butter/70",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function ChangeList({ request }: { request: ChangeRequest }) {
  const fields = EDITABLE_FIELDS.filter((f) => f in request.requested_values);
  return (
    <ul className="flex flex-col gap-1.5 text-base">
      {fields.map((f) => {
        const before = request.current_values[f];
        const after = request.requested_values[f];
        return (
          <li key={f} className="break-words">
            <span className="text-pix-butter/70">{FIELD_LABELS[f]}: </span>
            <span className="text-pix-butter/60 line-through">{before || "—"}</span>
            <span aria-hidden="true"> → </span>
            <span className="sr-only"> changed to </span>
            <span>{after || "(cleared)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StatusPill({ status }: { status: ChangeRequestStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center border-2 px-2 py-0.5 text-sm leading-tight ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

interface Props {
  membership: MembershipRow;
  extras: StudentExtras;
  requests: ChangeRequest[];
}

export function StudentDataPanel({ membership, extras, requests }: Props) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const sd = membership.student_data;
  const current: StudentValues = {
    first_name: sd?.first_name ?? null,
    middle_name: sd?.middle_name ?? null,
    last_name: sd?.last_name ?? null,
    year_level: sd?.year_level ?? null,
    program: sd?.program ?? null,
    section: sd?.section ?? null,
  };
  const name = fullName(current);

  const pending = requests.find((r) => r.status === "pending") ?? null;
  const history = requests.filter((r) => r.status !== "pending").slice(0, 5);

  async function withdraw() {
    if (!pending) return;
    setWithdrawing(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/member/change-requests/${pending.request_id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setNotice({ kind: "ok", text: "Request withdrawn." });
      } else {
        setNotice({ kind: "err", text: data.error ?? "Couldn't withdraw the request." });
      }
    } catch {
      setNotice({ kind: "err", text: "Something went wrong. Please check your connection and try again." });
    } finally {
      setWithdrawing(false);
      setConfirmWithdraw(false);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      {/* ── Current record ─────────────────────────────────────────────── */}
      <div className="border-4 border-pix-teal p-6 shadow-pixel-teal-6 sm:p-8">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className={dt}>Member ID</dt>
            <dd className={dd}>{membership.member_id}</dd>
          </div>
          <div>
            <dt className={dt}>Student number</dt>
            <dd className={dd}>{membership.student_number}</dd>
          </div>
          <div>
            <dt className={dt}>Name</dt>
            <dd className={dd}>{name || "—"}</dd>
          </div>
          <div>
            <dt className={dt}>Year level</dt>
            <dd className={dd}>{current.year_level || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className={dt}>Program</dt>
            <dd className={dd}>
              {current.program || "—"}
              {current.section && <span className="ml-2 text-pix-butter/70">Section {current.section}</span>}
            </dd>
          </div>
          {extras.email && (
            <div>
              <dt className={dt}>Email on file</dt>
              <dd className={dd}>{extras.email}</dd>
            </div>
          )}
          {extras.contact_number && (
            <div>
              <dt className={dt}>Contact number</dt>
              <dd className={dd}>{extras.contact_number}</dd>
            </div>
          )}
          {extras.date_of_birth && (
            <div>
              <dt className={dt}>Date of birth</dt>
              <dd className={dd}>{fmtDate(extras.date_of_birth)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => { setNotice(null); setFormOpen(true); }}
            disabled={!!pending}
            className={darkSubmit}
          >
            Request a change
          </button>
          {pending && <p className={darkHint}>You can send a new request once the current one is reviewed.</p>}
        </div>
        <p className={`mt-4 ${darkHint}`}>
          Something here isn&apos;t right? Changes are reviewed by an officer before they&apos;re applied.
          Your student number can&apos;t be changed here, so contact an administrator for that.
        </p>
      </div>

      {notice && (
        <div role="status" className={notice.kind === "ok" ? "border-4 border-pix-green px-4 py-3 text-base" : darkBanner}>
          {notice.text}
        </div>
      )}

      {/* ── Pending request ────────────────────────────────────────────── */}
      {pending && (
        <section aria-labelledby="pending-heading" className="border-4 border-pix-mustard p-6 shadow-pixel-mustard-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="pending-heading" className={`${hd} text-4xl`}>Your request</h2>
            <StatusPill status="pending" />
          </div>
          <p className={`mt-1 ${darkHint}`}>Sent {fmtDate(pending.created_at)}</p>
          <div className="mt-5"><ChangeList request={pending} /></div>
          <p className="mt-5 break-words text-base">
            <span className="text-pix-butter/70">Reason: </span>{pending.reason}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {confirmWithdraw ? (
              <>
                <span className="text-base">Withdraw this request?</span>
                <button type="button" onClick={withdraw} disabled={withdrawing} className={darkSubmit}>
                  {withdrawing ? "Withdrawing…" : "Yes, withdraw"}
                </button>
                <button type="button" onClick={() => setConfirmWithdraw(false)} disabled={withdrawing} className={darkOutline}>
                  Keep it
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmWithdraw(true)} className={darkOutline}>
                Withdraw request
              </button>
            )}
          </div>
        </section>
      )}

      {/* ── History ────────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className={`${hd} text-4xl`}>Past requests</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {history.map((r) => (
              <li key={r.request_id} className="border-4 border-pix-butter/30 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={darkHint}>{fmtDate(r.created_at)}</span>
                  <StatusPill status={r.status} />
                </div>
                <div className="mt-3"><ChangeList request={r} /></div>
                {r.review_note && (
                  <p className="mt-3 break-words text-base">
                    <span className="text-pix-butter/70">Note from the reviewer: </span>{r.review_note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {formOpen && (
        <Modal
          title="Request a change"
          wide
          bodyClass={bodyFont.className}
          headingClass={hd}
          onClose={() => setFormOpen(false)}
        >
          <ChangeRequestForm
            current={current}
            onCancel={() => setFormOpen(false)}
            onDone={() => {
              setFormOpen(false);
              setNotice({ kind: "ok", text: "Request sent. You'll see the decision here once it's reviewed." });
              router.refresh();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
