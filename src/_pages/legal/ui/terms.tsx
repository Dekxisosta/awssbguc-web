import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "./LegalLayout";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";

export const termsMetadata: Metadata = {
  title: "Terms of Service — AWSSBG-UC",
  description:
    "The terms that govern use of the AWS Student Builder Group – University of Cabuyao website and membership platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout active="terms" title="Terms of Service" updated="September 14, 2026">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the AWS Student
          Builder Group – University of Cabuyao (&quot;AWSSBG-UC,&quot; &quot;we,&quot; &quot;us&quot;)
          website and membership platform (the &quot;Platform&quot;). By creating an account, registering
          for an event, or otherwise using the Platform, you agree to be bound by these Terms and by our{" "}
          <a href="/privacy" className="font-medium text-[#00e482] hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and Accounts">
        <p>
          The Platform is intended for currently enrolled students, alumni, faculty, and partners of the
          University of Cabuyao (Pamantasan ng Cabuyao) and affiliated AWS Student Community programs.
          When you register, you agree to provide accurate profile information (such as your name, email
          address, and student details) and to keep it up to date. You are responsible for maintaining the
          confidentiality of your login credentials and for all activity that occurs under your account.
        </p>
      </LegalSection>

      <LegalSection title="3. Use of the Platform">
        <p>You agree to use the Platform only for its intended purposes, which include:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Registering for and checking in to workshops, bootcamps, and other AWSSBG-UC events.</li>
          <li>Viewing and managing your member profile, avatar, and event history.</li>
          <li>Accessing organizational documents such as the Constitution and By-Laws.</li>
          <li>Engaging with published blog content and community announcements.</li>
        </ul>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Attempt to gain unauthorized access to accounts, event QR codes, or administrative features.</li>
          <li>Upload or transmit content that is unlawful, harassing, or infringes another person&apos;s rights.</li>
          <li>Misrepresent your affiliation with AWSSBG-UC, AWS, or the University of Cabuyao.</li>
          <li>Interfere with or disrupt the integrity or performance of the Platform.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Event Registration and Attendance">
        <p>
          Registering for an event through the Platform reserves your spot subject to capacity and any
          eligibility requirements stated on the event page. Attendance may be verified through a
          personal QR code tied to your account. You are responsible for safeguarding your QR code, as it
          may be used to record attendance and issue certificates or credits on your behalf.
        </p>
      </LegalSection>

      <LegalSection title="5. Content and Intellectual Property">
        <p>
          The AWSSBG-UC name, logo, brand assets, and original content published on the Platform
          (including blog posts and the Constitution and By-Laws) belong to AWSSBG-UC or its licensors and
          may not be reproduced or used without permission, except as allowed under AWS Student Community
          and University of Cabuyao brand guidelines. Any content you submit (such as a profile photo)
          remains yours, but you grant AWSSBG-UC a limited license to display it on the Platform in
          connection with your membership and event participation.
        </p>
      </LegalSection>

      <LegalSection title="6. Termination">
        <p>
          We may suspend or terminate your access to the Platform if you violate these Terms, misuse
          event credentials, or engage in conduct that breaches the University of Cabuyao Student Code of
          Conduct or the AWS Community Code of Conduct. You may stop using the Platform, or request
          deletion of your account, at any time by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers and Limitation of Liability">
        <p>
          The Platform is provided by a student-led organization on an &quot;as is&quot; and &quot;as
          available&quot; basis, without warranties of any kind. AWSSBG-UC is not liable for indirect,
          incidental, or consequential damages arising from your use of the Platform, to the fullest
          extent permitted by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to These Terms">
        <p>
          We may update these Terms from time to time to reflect changes to the Platform or our
          operations. Material changes will be reflected by an updated &quot;Last Updated&quot; date above,
          and continued use of the Platform after changes take effect constitutes acceptance of the
          revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href={MAILTO} className="font-medium text-[#00e482] hover:underline">
            {SOCIALS.email}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
