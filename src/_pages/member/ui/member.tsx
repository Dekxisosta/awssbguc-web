import { MemberLinkForm } from "@/src/features/member-link";
import { StudentDataPanel } from "@/src/features/student-data-request";
import type { MembershipRow } from "@/src/entities/member";
import type { ChangeRequest, StudentExtras } from "@/src/entities/student-data";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";

export const memberMetadata = { title: "Membership — AWSSBG-UC" };

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";

interface MemberPageProps {
  membership: MembershipRow | null;
  extras: StudentExtras | null;
  requests: ChangeRequest[];
  githubUsername: string | null;
  repos: ShowcaseRepo[];
}

export function MemberPage({ membership, extras, requests, githubUsername, repos }: MemberPageProps) {
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
              ? "Review the student details on your SBG membership record, and ask for a correction if anything is off."
              : "Register your SBG membership by entering your student details below."}
          </p>
        </section>

        <Stripes className="h-4" />

        <section className={`${wrap} py-12 sm:py-16`}>
          {isLinked && membership ? (
            <StudentDataPanel
              membership={membership}
              extras={extras ?? { contact_number: null, email: null, date_of_birth: null }}
              requests={requests}
            />
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
