import { MemberLinkForm } from "@/src/features/member-link";
import type { MembershipRow } from "@/src/entities/member";

export const memberMetadata = { title: "Membership — AWSSBG-UC" };

interface MemberPageProps {
  membership: MembershipRow | null;
}

export function MemberPage({ membership }: MemberPageProps) {
  const sd = membership?.student_data ?? null;
  const fullName = sd
    ? [sd.first_name, sd.middle_name, sd.last_name].filter(Boolean).join(" ").trim()
    : null;
  const isLinked = !!membership;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Membership</h1>
        <p className="mt-1.5 text-sm text-neutral-400">
          {isLinked
            ? "Your account is linked to an SBG membership record."
            : "Register your SBG membership by entering your student details below."}
        </p>
      </div>

      {isLinked && membership ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Member ID</dt>
                <dd className="mt-1 font-mono text-sm text-neutral-100">{membership.member_id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Student number</dt>
                <dd className="mt-1 font-mono text-sm text-neutral-100">{membership.student_number}</dd>
              </div>
              {fullName && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Name</dt>
                  <dd className="mt-1 text-sm text-neutral-100">{fullName}</dd>
                </div>
              )}
              {sd?.year_level && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Year level</dt>
                  <dd className="mt-1 text-sm text-neutral-100">{sd.year_level}</dd>
                </div>
              )}
              {sd?.program && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Program</dt>
                  <dd className="mt-1 text-sm text-neutral-100">
                    {sd.program}
                    {sd.section && <span className="ml-2 text-neutral-500">Section {sd.section}</span>}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <p className="text-xs text-neutral-500">
            To change or unlink your membership record, contact an administrator.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
          <MemberLinkForm />
        </div>
      )}
    </div>
  );
}
