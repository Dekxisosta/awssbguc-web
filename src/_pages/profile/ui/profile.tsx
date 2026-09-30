import Image from "next/image";
import { ProfileCard } from "@/src/features/profile-edit";

export const profileMetadata = { title: "Profile — AWSSBG-UC" };

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
}

/**
 * Zone measurements from the 1224×936 source image (px → % of image):
 *
 *   Big card:  x1=220 y1=100  x2=1195 y2=690
 *     left=18%   top=10.7%  right=2.4%   bottom=26.3%
 *
 *   Pill:      x1=220 y1=720  x2=980  y2=870
 *     left=18%   top=76.9%  right=19.9%  bottom=7%
 */

export function ProfilePage(props: ProfilePageProps) {
  return (
    <div>
      {/* ── Mobile layout (< sm) — free flex stack, no artboard wrapper ─── */}
      <div className="sm:hidden px-4 py-6">
        {/* Slot divs for portals — still needed so ProfileCard mounts cleanly */}
        <div id="profile-card-zone-mobile" className="hidden" />
        <div id="profile-pill-zone-mobile" className="hidden" />
        <div id="profile-qr-zone-mobile" className="hidden" />

        <ProfileCard
          {...props}
          cardSlotId="profile-card-zone-mobile"
          pillSlotId="profile-pill-zone-mobile"
          qrSlotId="profile-qr-zone-mobile"
          mobileLayout
        />
      </div>

      {/* ── Desktop layout (sm+) — artboard with positioned zones ──────── */}
      <div className="hidden sm:block">
        <div className="mx-auto w-full max-w-2xl px-6 py-10">
          {/* Aspect-ratio shell — 1224:936 ≈ 76.47% */}
          <div className="relative w-full" style={{ paddingBottom: "76.47%" }}>

            {/* Background artwork */}
            <Image
              src="/profile/main_container.png"
              alt=""
              fill
              sizes="896px"
              className="pointer-events-none select-none object-contain"
              priority
            />

            {/* ── Big card zone ── */}
            <div
              id="profile-card-zone"
              className="absolute overflow-visible"
              style={{ left: "18%", top: "10.7%", right: "14%", bottom: "26.3%" }}
            />

            {/* ── Pill zone ── */}
            <div
              id="profile-pill-zone"
              className="absolute overflow-hidden"
              style={{ left: "18%", top: "76.9%", right: "19.9%", bottom: "7%" }}
            />

            {/* ── QR zone ── */}
            <div
              id="profile-qr-zone"
              className="absolute"
              style={{ right: "6%", bottom: "8%", width: "12%", aspectRatio: "1" }}
            />

            <ProfileCard
              {...props}
              cardSlotId="profile-card-zone"
              pillSlotId="profile-pill-zone"
              qrSlotId="profile-qr-zone"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
