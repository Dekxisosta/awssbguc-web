import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { ProfileCard } from "@/src/features/profile-edit";
import { SidePixels, PixelClouds } from "@/src/widgets/home-client";

export const profileMetadata = { title: "Profile — AWSSBG-UC" };

/**
 * Profile page in the pixel-art direction of the home page: black ground, butter-yellow type,
 * Jersey 10 headlines, drifting clouds and edge pixels. The interactive body (member pass, detail
 * tiles, edit modal) lives in the profile-edit feature.
 */

// Same fonts as the home page. (Rebuilt here: this is a server component, and non-component exports
// from the "use client" HomeClient module arrive as client references, not strings.)
const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });

// Headlines: set the class directly, since the element-level heading font in globals.css would otherwise win.
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";

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
}

export function ProfilePage(props: ProfilePageProps) {
  return (
    <div className={`${pixel.className} relative isolate bg-black tracking-normal text-[#fff7a1]`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <section className={`${wrap} pb-10 pt-10 sm:pb-14 sm:pt-14`}>
          <p className="text-xl">AWSSBG-UC</p>
          <h1 className={`${hd} mt-3 text-[clamp(5rem,13vw,10rem)]`}>Profile</h1>
          <p className="mt-6 max-w-2xl text-2xl leading-snug">
            Your member pass, and what other members see about you.
          </p>
        </section>

        <ProfileCard {...props} bodyClass={pixel.className} headingClass={hd} />
      </div>
    </div>
  );
}
