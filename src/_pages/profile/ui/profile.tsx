import { bodyFont, hd } from "@/src/shared/config/fonts";
import { ProfileCard } from "@/src/features/profile-edit";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import type { MembershipRow } from "@/src/entities/member";
import type { StudentExtras } from "@/src/entities/student-data";
import { SidePixels, PixelClouds } from "@/src/widgets/home-client";

export const profileMetadata = { title: "Profile — AWSSBG-UC" };

/**
 * Profile page in the pixel-art direction of the home page: black ground, butter-yellow type,
 * Jersey 10 headlines, drifting clouds and edge pixels. The interactive body (member pass, detail
 * tiles, edit modal) lives in the profile-edit feature.
 */

// Same fonts as the home page. (Rebuilt here: this is a server component, and non-component exports
// from the "use client" HomeClient module arrive as client references, not strings.)

// Headlines: set the class directly, since the element-level heading font in globals.css would otherwise win.

export interface ProfilePageProps {
  fullName: string;
  memberId: string | null;
  email: string;
  initialUsername: string | null;
  discordId: string | null;
  githubUsername: string | null;
  initialAvatarUrl: string | null;
  qrToken: string | null;
  displayName: string | null;
  participantId: string | null;
  /** ISO timestamp — set when the user has requested account deletion */
  deletionScheduledAt: string | null;
  /** Whether the profile is opted into the public member directory */
  directoryVisible: boolean;
  /** Short public bio (max 280 chars) */
  bio: string | null;
  /** Self-reported skill tags */
  skills: string[] | null;
  /** ISO timestamp of one-time username change; null means never changed */
  usernameChangedAt: string | null;
  /** Showcased GitHub repos (up to 3) with their pictures */
  initialRepos: ShowcaseRepo[];
  /** Linked membership record (student data), or null when there is none */
  membership: MembershipRow | null;
  /** Read-only extras historical rows may carry */
  extras: StudentExtras | null;
  /** True when the membership record could not be loaded (as opposed to not existing) */
  membershipUnavailable?: boolean;
}

export function ProfilePage(props: ProfilePageProps) {
  return (
    <div className={`${bodyFont.className} relative isolate overflow-x-clip bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10 pt-10 sm:pt-14">
        <h1 className="sr-only">Profile</h1>

        <ProfileCard {...props} bodyClass={bodyFont.className} headingClass={hd} />
      </div>
    </div>
  );
}
