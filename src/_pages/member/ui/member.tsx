import { MemberLinkForm } from "@/src/features/member-link";
import type { MembershipRow } from "@/src/entities/member";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";

export const memberMetadata = { title: "Membership — AWSSBG-UC" };

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";

const dt = "text-sm uppercase tracking-wide text-pix-butter/70";
const dd = "mt-1 break-words text-lg";

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
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <section className={`${wrap} pb-10 pt-10 sm:pb-14 sm:pt-14`}>
          <p className="text-xl">AWSSBG-UC</p>
          <h1 className={`${hd} mt-3 text-[clamp(4rem,11vw,8rem)]`}>Membership</h1>
          <p className="mt-6 max-w-2xl text-2xl leading-snug">
            {isLinked
              ? "Your account is linked to an SBG membership record."
              : "Register your SBG membership by entering your student details below."}
          </p>
        </section>

        <Stripes className="h-4" />

        <section className={`${wrap} py-12 sm:py-16`}>
          {isLinked && membership ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
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
                  {fullName && (
                    <div>
                      <dt className={dt}>Name</dt>
                      <dd className={dd}>{fullName}</dd>
                    </div>
                  )}
                  {sd?.year_level && (
                    <div>
                      <dt className={dt}>Year level</dt>
                      <dd className={dd}>{sd.year_level}</dd>
                    </div>
                  )}
                  {sd?.program && (
                    <div className="sm:col-span-2">
                      <dt className={dt}>Program</dt>
                      <dd className={dd}>
                        {sd.program}
                        {sd.section && <span className="ml-2 text-pix-butter/70">Section {sd.section}</span>}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <p className="text-sm text-pix-butter/70">
                To change or unlink your membership record, contact an administrator.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl border-4 border-pix-teal p-6 shadow-pixel-teal-6 sm:p-8">
              <MemberLinkForm />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
