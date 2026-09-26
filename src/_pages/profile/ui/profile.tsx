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
      <div className="mx-auto w-full max-w-2xl px-2 py-6 sm:px-6 sm:py-10">
        {/* Aspect-ratio shell — 1224:936 ≈ 76.47% */}
        <div className="relative w-full" style={{ paddingBottom: "76.47%" }}>

          {/* Background artwork */}
          <Image
            src="/profile/main_container.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="pointer-events-none select-none object-contain"
            priority
          />

          {/* ── Big card zone — slot divs rendered first so the portal finds them ── */}
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

          {/* ── QR zone — bottom-right corner of the wrapper ── */}
          <div
            id="profile-qr-zone"
            className="absolute"
            style={{ right: "6%", bottom: "8%", width: "12%", aspectRatio: "1" }}
          />

          {/*
            ProfileCard is a client component. It mounts after the slot divs
            exist in the DOM, then portals card content into #profile-card-zone
            and pill content into #profile-pill-zone.
          */}
          <ProfileCard
            {...props}
            cardSlotId="profile-card-zone"
            pillSlotId="profile-pill-zone"
            qrSlotId="profile-qr-zone"
          />

        </div>
      </div>
    </div>
  );
}
