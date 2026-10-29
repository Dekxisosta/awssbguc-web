import { bodyFont, hd } from "@/src/shared/config/fonts";
import { SidePixels, PixelClouds } from "@/src/widgets/home-client";
import { SOCIALS } from "@/src/shared/config/socials";

export const socialsMetadata = { title: "Socials — AWSSBG-UC" };

/**
 * Socials page in the pixel-art direction of the home page:
 * black ground, butter-yellow type, Jersey 10 headlines, square corners, hard offset shadows.
 * Discord for the community chat, Facebook for official announcements.
 */

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

const btnPrimary = `inline-flex items-center justify-center gap-2 border-4 border-pix-butter bg-pix-butter px-6 py-3 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;
const btnDark = `inline-flex items-center justify-center gap-2 border-4 border-black bg-black px-6 py-3 text-lg text-pix-butter shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;

// ─── Discord SVG ──────────────────────────────────────────────────────────────

function DiscordIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ─── Facebook SVG ─────────────────────────────────────────────────────────────

function FacebookIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── Discord card ─────────────────────────────────────────────────────────────

const DISCORD_PERKS = [
  "Channels for AWS services, study sessions, and job sharing",
  "First to hear about events and workshops",
  "Project feedback, career tips, and certification support",
];

function DiscordCard() {
  return (
    <div className="flex flex-col border-4 border-pix-teal p-6 shadow-pixel-teal-8">
      <p className="flex items-center gap-2 text-xl text-pix-teal">
        <DiscordIcon size={20} />
        Discord
      </p>
      <h3 className={`${hd} mt-2 text-5xl leading-none`}>Chat with the community</h3>
      <p className="mt-4 leading-snug text-pix-butter/85">
        Ask questions, share projects, and meet members across every year level.
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm leading-snug">
        {DISCORD_PERKS.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-pix-teal" />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:gap-4">
        <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
          <DiscordIcon size={18} />
          Join the Discord
        </a>
        <span className="text-sm text-pix-butter/70">Free · discord.gg/JxACGrMAMK</span>
      </div>
    </div>
  );
}

// ─── Facebook card (butter panel) ─────────────────────────────────────────────

const FB_PERKS = [
  "Official announcements and important updates",
  "Event postings, registration links, and recaps",
];

function FacebookCard() {
  return (
    <div className="flex flex-col border-4 border-black bg-pix-butter p-6 text-black shadow-pixel-rust-8">
      <p className="flex items-center gap-2 text-xl text-pix-rust">
        <FacebookIcon size={20} />
        Facebook
      </p>
      <h3 className={`${hd} mt-2 text-5xl leading-none`}>Events and announcements</h3>
      <p className="mt-4 leading-snug">
        Our Facebook page is the primary channel for official news and event recaps.
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm leading-snug">
        {FB_PERKS.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 bg-black" />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:gap-4">
        <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className={btnDark}>
          <FacebookIcon size={18} />
          Follow on Facebook
        </a>
        <span className="text-sm text-black/70">facebook.com/awsccpnc</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SocialsPage() {
  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <section className="relative z-10 mx-auto w-full max-w-[1300px] px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xl">Socials</p>
        <h1 className={`${hd} mt-3 text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.9]`}>
          Find us <span className="text-pix-green">online</span>.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-snug text-pix-butter/85">
          Chat with members on Discord, and follow Facebook for official announcements and event recaps.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <DiscordCard />
          <FacebookCard />
        </div>
      </section>
    </div>
  );
}
