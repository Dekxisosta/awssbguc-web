import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "./LegalLayout";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";

export const privacyMetadata: Metadata = {
  title: "Privacy Policy — AWSSBG-UC",
  description:
    "How the AWS Student Builder Group – University of Cabuyao collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout active="privacy" title="Privacy Policy" updated="September 14, 2026">
      <LegalSection title="1. Overview">
        <p>
          This Privacy Policy explains how the AWS Student Builder Group – University of Cabuyao
          (&quot;AWSSBG-UC,&quot; &quot;we,&quot; &quot;us&quot;) collects, uses, stores, and protects
          personal information through our website and membership platform (the &quot;Platform&quot;). We
          process personal data in line with the Data Privacy Act of 2012 (Republic Act No. 10173) of the
          Philippines.
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account information:</strong> your name, email address, and password (stored securely
            via our authentication provider, Supabase).
          </li>
          <li>
            <strong>Profile information:</strong> username, avatar/profile photo, and, where applicable,
            your linked member roster details (e.g., student number, department).
          </li>
          <li>
            <strong>Event data:</strong> event registrations, RSVP status, and attendance records
            captured through your personal QR code.
          </li>
          <li>
            <strong>Usage data:</strong> basic technical information such as log data and device/browser
            information, collected automatically to keep the Platform secure and functioning.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To create and manage your account and member profile.</li>
          <li>To process event registrations, verify attendance, and issue certificates or credits.</li>
          <li>To communicate updates, announcements, and event-related information to you.</li>
          <li>To maintain the security, integrity, and proper functioning of the Platform.</li>
          <li>To comply with university accreditation and reporting requirements where applicable.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. How We Store and Protect Your Information">
        <p>
          Your data is stored using Supabase, our backend and database provider, with access controlled
          through authentication and row-level security policies. Administrative access to member data is
          limited to authorized AWSSBG-UC officers (such as the Executive Secretary and Technical Working
          Group) who need it to operate the Platform.
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing of Information">
        <p>
          We do not sell your personal information. We may share limited information:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>With the University of Cabuyao&apos;s Student Affairs and Services Department (SASD), where required for accreditation or compliance.</li>
          <li>With the AWS Builder Center / AWS Student Community program, where required to verify participation in AWS-affiliated events or certifications.</li>
          <li>With service providers (such as Supabase) strictly to operate the Platform on our behalf.</li>
          <li>Where required by law or to protect the rights, safety, or property of AWSSBG-UC or its members.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Your Rights">
        <p>
          Under the Data Privacy Act of 2012, you have the right to be informed, to access your personal
          data, to correct inaccurate data, to object to certain processing, and to request deletion of
          your data, subject to our record-keeping obligations for event accreditation. To exercise these
          rights, contact us using the details below.
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention">
        <p>
          We retain account and event data for as long as your account is active or as needed to fulfil
          the purposes described in this policy, including institutional accreditation requirements. You
          may request that your account and associated data be deleted at any time, subject to any
          records we are required to keep.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by an
          updated &quot;Last Updated&quot; date above, and, where appropriate, communicated through the
          Platform.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For privacy questions or requests, contact us at{" "}
          <a href={MAILTO} className="font-medium text-[#00e482] hover:underline">
            {SOCIALS.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
