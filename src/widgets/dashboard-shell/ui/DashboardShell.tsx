"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { SideGrid } from "@/src/widgets/side-grid";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";
import { colors } from "@/tailwind.tokens";

/**
 * Navbar + footer in the pixel-art direction of the home page:
 *  - black ground, butter-yellow (#fff7a1) type, Jersey 10 headings, Pixelify Sans text
 *  - the stripe "tunnel" palette reused as thin dividers
 *  - square corners, hard offset shadows, thick borders; no blur, no rounded anything
 *
 * Fonts are applied only to the header, footer and portaled overlays, so page content keeps its own fonts.
 */

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });

const px = pixel.className;
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

// Each nav item gets its own hover color from the stripe palette. `on` is the active/open state.
const TONES = {
  teal:   { on: "bg-pix-teal text-black",     off: "text-pix-butter hover:bg-pix-teal hover:text-black" },
  gold:   { on: "bg-pix-mustard text-black",     off: "text-pix-butter hover:bg-pix-mustard hover:text-black" },
  red:    { on: "bg-pix-rust text-pix-butter", off: "text-pix-butter hover:bg-pix-rust" },
  green:  { on: "bg-pix-green text-black",     off: "text-pix-butter hover:bg-pix-green hover:text-black" },
  coral:  { on: "bg-pix-coral text-black",     off: "text-pix-butter hover:bg-pix-coral hover:text-black" },
  amber:  { on: "bg-pix-amber text-black",     off: "text-pix-butter hover:bg-pix-amber hover:text-black" },
  butter: { on: "bg-pix-butter text-black",     off: "text-pix-butter hover:bg-pix-butter hover:text-black" },
} as const;
type Tone = keyof typeof TONES;

// Top-level nav links and the trigger buttons share one shape (no borders).
const navBase = `flex shrink-0 items-center gap-1.5 px-2.5 py-1 text-base transition-colors ${focus}`;
const navCls = (tone: Tone, active = false) => `${navBase} ${active ? TONES[tone].on : TONES[tone].off}`;

/** A nav entry is active on its own page and on pages beneath it (/events/[slug], /members/[username]). */
const isActivePath = (pathname: string, href: string) =>
  pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

// Rows inside dropdown panels.
const rowBase = "flex items-center gap-3 px-4 py-2.5 text-base transition-colors";
const rowOn = "bg-pix-teal text-black";
const rowOff = "text-pix-butter hover:bg-pix-butter hover:text-black";

function Stripes({ className = "h-2" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-stripes ${className}`} />;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone?: Tone;
  /** Only rendered for admins. */
  adminOnly?: boolean;
}

interface DashboardShellProps {
  isAuthenticated: boolean;
  /** True when the signed-in user holds the admin role. Controls every admin-only link and button. */
  isAdmin?: boolean;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  memberId: string | null;
  children: React.ReactNode;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function Icon({ size = 15, children }: { size?: number; children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function EmailIcon({ size = 20 }: { size?: number }) {
  return (
    <Icon size={size}>
      <rect width="20" height="16" x="2" y="4" />
      <path d="m22 7-10 6L2 7" />
    </Icon>
  );
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const NAV_ENTRIES: NavItem[] = [
  {
    href: "/",
    label: "Home",
    tone: "teal",
    icon: (
      <Icon>
        <rect width="7" height="9" x="3" y="3" /><rect width="7" height="5" x="14" y="3" />
        <rect width="7" height="9" x="14" y="12" /><rect width="7" height="5" x="3" y="16" />
      </Icon>
    ),
  },
  {
    href: "/events",
    label: "Events",
    tone: "gold",
    icon: (
      <Icon>
        <rect width="18" height="18" x="3" y="4" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      </Icon>
    ),
  },
  {
    href: "/join",
    label: "Join Us",
    tone: "red",
    icon: (
      <Icon>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </Icon>
    ),
  },
  {
    href: "/members",
    label: "Community",
    tone: "green",
    icon: (
      <Icon>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </Icon>
    ),
  },
];

// Items collapsed into the "Discover" dropdown
const DISCOVER_ITEMS: NavItem[] = [
  {
    href: "/about",
    label: "About",
    icon: <Icon><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Icon>,
  },
  {
    href: "/constitution",
    label: "Constitution",
    icon: (
      <Icon>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </Icon>
    ),
  },
  {
    href: "/privacy",
    label: "Privacy",
    icon: <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
  },
  {
    href: "/terms",
    label: "Terms",
    icon: <Icon><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></Icon>,
  },
];

// AWS resource links for the AWS dropdown
const AWS_RESOURCE_ITEMS: { label: string; href: string; internal?: boolean }[] = [
  { label: "Free Resources", href: "/aws", internal: true },
  { label: "AWS Console",    href: "https://console.aws.amazon.com/" },
  { label: "Skill Builder",  href: "https://skillbuilder.aws/" },
  { label: "AWS Free Tier",  href: "https://aws.amazon.com/free/" },
  { label: "Builder Labs",   href: "https://aws.amazon.com/training/digital/aws-builder-labs/" },
  { label: "Workshops",      href: "https://workshops.aws/" },
  { label: "Certifications", href: "https://aws.amazon.com/certification/" },
  { label: "Documentation",  href: "https://docs.aws.amazon.com/" },
];

const CONTACT_ITEMS = [
  { label: "Discord",  href: SOCIALS.discord,  icon: <DiscordIcon size={15} /> },
  { label: "Facebook", href: SOCIALS.facebook, icon: <FacebookIcon size={15} /> },
  { label: "Email",    href: MAILTO,           icon: <EmailIcon size={15} /> },
];

const PROFILE_NAV: NavItem[] = [
  {
    href: "/profile",
    label: "Profile",
    icon: <Icon><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></Icon>,
  },
  {
    href: "/member",
    label: "Membership",
    icon: <Icon><rect width="20" height="14" x="2" y="5" /><path d="M2 10h20" /></Icon>,
  },
  {
    href: "/admin",
    label: "Admin",
    adminOnly: true,
    icon: <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>,
  },
];

const isExternalHref = (href: string) => href.startsWith("mailto:") || href.startsWith("http");

// ─── Shared bits ──────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ExternalArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true" className="shrink-0 opacity-70">
      <path d="M7 7h10v10" /><path d="M7 17 17 7" />
    </svg>
  );
}

function InternalArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true" className="shrink-0 opacity-70">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** Open/close state + trigger position for a portaled dropdown. Closes on route change. */
function useAnchor(pathname?: string) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  function toggle() {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  return { open, setOpen, mounted, rect, triggerRef, toggle };
}

// ─── Desktop dropdown (portaled), used for Discover / AWS / Contact ───────────

function Dropdown({
  label,
  pathname,
  tone = "teal",
  accent = colors.pix.teal,
  width = "w-52",
  active = false,
  children,
}: {
  label: string;
  pathname: string;
  tone?: Tone;
  accent?: string;
  width?: string;
  active?: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const { open, setOpen, mounted, rect, triggerRef, toggle } = useAnchor(pathname);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={navCls(tone, open || active)}
      >
        {label}
        <Chevron open={open} />
      </button>
      {mounted && open && rect &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className={`${px} fixed ${width} bg-black py-1 text-pix-butter`}
              style={{
                zIndex: 99999,
                top: rect.bottom + 8,
                left: rect.left,
                boxShadow: `6px 6px 0 ${accent}`,
              }}
            >
              {children(() => setOpen(false))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function DiscoverDropdown({ pathname }: { pathname: string }) {
  return (
    <Dropdown label="Discover" pathname={pathname} tone="coral" accent={colors.pix.coral} active={DISCOVER_ITEMS.some((i) => pathname === i.href)}>
      {(close) =>
        DISCOVER_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={`${rowBase} ${pathname === item.href ? rowOn : rowOff}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))
      }
    </Dropdown>
  );
}

function AwsDropdown({ pathname }: { pathname: string }) {
  return (
    <Dropdown label="AWS" pathname={pathname} tone="amber" accent={colors.pix.amber}>
      {(close) => (
        <>
          <p className={`${hd} px-4 pb-1 pt-2 text-2xl text-pix-amber`}>AWS Resources</p>
          {AWS_RESOURCE_ITEMS.map((item) =>
            item.internal ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={`${rowBase} justify-between text-pix-green hover:bg-pix-green hover:text-black`}
              >
                {item.label}
                <InternalArrow />
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className={`${rowBase} justify-between text-pix-butter hover:bg-pix-amber hover:text-black`}
              >
                {item.label}
                <ExternalArrow />
              </a>
            )
          )}
        </>
      )}
    </Dropdown>
  );
}

function ContactDropdown({ pathname }: { pathname: string }) {
  return (
    <Dropdown label="Contact" pathname={pathname} tone="butter" accent={colors.pix.butter} width="w-48">
      {(close) =>
        CONTACT_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target={item.href.startsWith("mailto") ? undefined : "_blank"}
            rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
            onClick={close}
            className={`${rowBase} ${rowOff}`}
          >
            {item.icon}
            {item.label}
          </a>
        ))
      }
    </Dropdown>
  );
}

// ─── Mobile dropdown menu (portaled, fixed below the header) ─────────────────

const mobRow = "flex items-center gap-3 px-3 py-2.5 text-base transition-colors";
const mobCls = (tone: Tone, active = false) => `${mobRow} ${active ? TONES[tone].on : TONES[tone].off}`;

function Collapsible({
  icon,
  label,
  tone,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone: Tone;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} className={`${mobCls(tone)} w-full`}>
        {icon}
        {label}
        <Chevron open={open} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-1 flex flex-col gap-0.5 pl-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ avatarUrl, initials, className = "" }: { avatarUrl: string | null; initials: string; className?: string }) {
  return (
    <div className={`shrink-0 overflow-hidden border-2 border-pix-butter bg-pix-butter text-black ${className}`}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
      ) : (
        <span className={`${hd} flex h-full w-full items-center justify-center text-xl`}>{initials || "?"}</span>
      )}
    </div>
  );
}

function SignOutIcon() {
  return (
    <Icon size={14}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </Icon>
  );
}

function MobileMenu({
  open,
  onClose,
  pathname,
  isAuthenticated,
  displayName,
  username,
  avatarUrl,
  initials,
  headerHeight,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  isAuthenticated: boolean;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  initials: string;
  headerHeight: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(() => DISCOVER_ITEMS.some((i) => pathname === i.href));
  const [awsOpen, setAwsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) {
      setDiscoverOpen(DISCOVER_ITEMS.some((i) => pathname === i.href));
      setAwsOpen(false);
      setContactOpen(false);
    }
  }, [open, pathname]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70"
            style={{ zIndex: 99998, top: headerHeight }}
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Dropdown panel */}
          <motion.div
            key="mobile-menu-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`${px} fixed left-0 right-0 overflow-y-auto bg-black text-pix-butter`}
            style={{ zIndex: 99999, top: headerHeight, maxHeight: `calc(100vh - ${headerHeight}px)` }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            id="mobile-nav-menu"
          >
            <div className={`${wrap} py-3`}>
              {/* Top-level links */}
              <nav className="flex flex-col gap-0.5">
                {NAV_ENTRIES.map((entry) => {
                  const active = isActivePath(pathname, entry.href);
                  const cls = mobCls(entry.tone ?? "teal", active);
                  return isExternalHref(entry.href) ? (
                    <a key={entry.href} href={entry.href} className={cls} onClick={onClose}>
                      {entry.icon}{entry.label}
                    </a>
                  ) : (
                    <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} className={cls} onClick={onClose}>
                      {entry.icon}{entry.label}
                    </Link>
                  );
                })}

                <Collapsible
                  icon={<Icon><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></Icon>}
                  label="Discover"
                  tone="coral"
                  open={discoverOpen}
                  onToggle={() => setDiscoverOpen((o) => !o)}
                >
                  {DISCOVER_ITEMS.map((entry) => {
                    const active = isActivePath(pathname, entry.href);
                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                        className={`${mobCls("coral", active)} !py-2`}
                      >
                        {entry.icon}{entry.label}
                      </Link>
                    );
                  })}
                </Collapsible>

                <Collapsible
                  icon={<Icon><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>}
                  label="AWS"
                  tone="amber"
                  open={awsOpen}
                  onToggle={() => setAwsOpen((o) => !o)}
                >
                  {AWS_RESOURCE_ITEMS.map((item) =>
                    item.internal ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`${mobRow} justify-between !py-2 text-pix-green hover:bg-pix-green hover:text-black`}
                      >
                        {item.label}
                        <InternalArrow />
                      </Link>
                    ) : (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className={`${mobRow} justify-between !py-2 text-pix-butter hover:bg-pix-amber hover:text-black`}
                      >
                        {item.label}
                        <ExternalArrow />
                      </a>
                    )
                  )}
                </Collapsible>

                <Collapsible
                  icon={<Icon><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Icon>}
                  label="Contact"
                  tone="butter"
                  open={contactOpen}
                  onToggle={() => setContactOpen((o) => !o)}
                >
                  {CONTACT_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith("mailto") ? undefined : "_blank"}
                      rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                      onClick={onClose}
                      className={`${mobCls("butter")} !py-2`}
                    >
                      {item.icon}{item.label}
                    </a>
                  ))}
                </Collapsible>
              </nav>

              {/* Divider */}
              <Stripes className="my-3 h-1.5" />

              {/* Auth actions */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-1 pb-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar avatarUrl={avatarUrl} initials={initials} className="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="truncate text-base">{displayName}</p>
                      {username && <p className="truncate text-sm text-pix-butter/60">@{username}</p>}
                    </div>
                  </div>
                  <form action="/api/auth/logout" method="POST">
                    <button type="submit" className={`${mobCls("coral")} w-full`}>
                      <SignOutIcon />
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-3 pb-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className={`flex-1 px-3 py-2 text-center text-base transition-colors ${TONES.green.off} ${focus}`}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className={`flex-1 bg-pix-butter px-3 py-2 text-center text-base text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`}
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
            <Stripes className="h-2" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Search palette ───────────────────────────────────────────────────────────

const ALL_SEARCH_ITEMS: { href: string; label: string; group: string; adminOnly?: boolean }[] = [
  // Top-level nav
  { href: "/",             label: "Home",            group: "Pages" },
  { href: "/events",       label: "Events",          group: "Pages" },
  { href: "/join",         label: "Join Us",         group: "Pages" },
  { href: "/members",      label: "Community",       group: "Pages" },
  // Discover
  { href: "/about",        label: "About",           group: "Discover" },
  { href: "/constitution", label: "Constitution",    group: "Discover" },
  { href: "/privacy",      label: "Privacy",         group: "Discover" },
  { href: "/terms",        label: "Terms",           group: "Discover" },
  // AWS
  { href: "/aws",          label: "Free Resources",  group: "AWS" },
  // Auth / account
  { href: "/profile",       label: "Profile",         group: "Account" },
  { href: "/profile-setup", label: "Profile Setup",   group: "Account" },
  { href: "/member",        label: "Membership",      group: "Account" },
  { href: "/admin",         label: "Admin Dashboard", group: "Account", adminOnly: true },
];

function SearchPalette({ onClose, isAdmin }: { onClose: () => void; isAdmin: boolean }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const items = ALL_SEARCH_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const filtered = q
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q)
      )
    : items;

  // Group results
  const groups = filtered.reduce<Record<string, typeof items>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  function navigate(href: string) {
    router.push(href);
    onClose();
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" style={{ zIndex: 100000 }} onClick={onClose} aria-hidden="true" />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        className={`${px} fixed left-1/2 top-[12vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 border-4 border-pix-butter bg-black text-pix-butter shadow-pixel-teal-8`}
        style={{ zIndex: 100001 }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b-4 border-pix-butter px-4 py-3">
          <Icon size={16}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-base text-pix-butter placeholder:text-pix-butter/40 focus:outline-none"
          />
          <kbd className="hidden border-2 border-pix-butter/50 px-1.5 py-0.5 text-xs text-pix-butter/60 sm:block">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(groups).length === 0 ? (
            <p className="px-4 py-6 text-center text-base text-pix-butter/60">No pages found.</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className={`${hd} px-4 pb-1 pt-2 text-2xl text-pix-teal`}>{group}</p>
                {items.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-base transition-colors hover:bg-pix-butter hover:text-black"
                  >
                    <span>{item.label}</span>
                    <span className="text-sm opacity-60">{item.href}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Profile dropdown (portaled, anchored to avatar button) ──────────────────

function ProfileDropdown({
  avatarUrl,
  initials,
  displayName,
  username,
  memberId,
  pathname,
  isAdmin,
  size = 9,
}: {
  avatarUrl: string | null;
  initials: string;
  displayName: string;
  username: string | null;
  memberId: string | null;
  pathname: string;
  isAdmin: boolean;
  size?: number;
}) {
  const { open, setOpen, mounted, rect, triggerRef, toggle } = useAnchor(pathname);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
        className={`shrink-0 transition-opacity ${focus} ${size === 8 ? "h-8 w-8" : "h-9 w-9"} ${
          open ? "opacity-70" : "hover:opacity-70"
        }`}
      >
        <Avatar avatarUrl={avatarUrl} initials={initials} className="h-full w-full border-0" />
      </button>

      {mounted && open && rect &&
        createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className={`${px} fixed w-60 bg-black text-pix-butter shadow-pixel-teal-6`}
              style={{ zIndex: 99999, top: rect.bottom + 8, right: window.innerWidth - rect.right }}
            >
              {/* Identity row */}
              <div className="flex items-center gap-3 border-b-2 border-pix-butter/20 px-4 py-3">
                <Avatar avatarUrl={avatarUrl} initials={initials} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-base">{displayName}</p>
                  {username && <p className="truncate text-sm text-pix-butter/60">@{username}</p>}
                  {memberId && <p className="truncate text-xs text-pix-butter/40">{memberId}</p>}
                </div>
              </div>

              {/* Nav links */}
              <div className="py-1">
                {PROFILE_NAV.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`${rowBase} ${pathname === item.href ? rowOn : rowOff}`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Sign out */}
              <div className="border-t-2 border-pix-butter/20 py-1">
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className={`${rowBase} ${rowOff} w-full`}>
                    <SignOutIcon />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const footerLink = `text-lg text-pix-butter/80 transition-colors hover:text-pix-butter hover:underline hover:underline-offset-4 ${focus}`;

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={`${hd} text-3xl text-pix-butter`}>{title}</p>
      {children}
    </div>
  );
}

const socialTile = `flex h-11 w-11 items-center justify-center border-4 border-black bg-black text-pix-butter shadow-pixel-rust-3 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-1 ${focus}`;

export function Footer({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <footer className={`${px} bg-black text-pix-butter`} aria-label="Site footer">
      <Stripes className="h-4" />

      {/* ── Brand card + link columns ── */}
      <div className={`${wrap} pb-10 pt-14`}>
        <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
          {/* Brand card */}
          <div className="self-start bg-pix-butter p-5 text-black shadow-pixel-teal-6">
            <div className="flex items-center gap-3">
              <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
              <div>
                <p className={`${hd} text-4xl`}>AWSSBG-UC</p>
                <p className="mt-1 text-sm leading-none">AWS Student Builder Group</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-snug">
              A student-led community at the University of Cabuyao for building cloud skills, sharing knowledge, and connecting AWS enthusiasts across campus.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" aria-label="Discord server" className={socialTile}>
                <DiscordIcon />
              </a>
              <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook page" className={socialTile}>
                <FacebookIcon />
              </a>
              <a href={MAILTO} aria-label="Email us" className={socialTile}>
                <EmailIcon />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <FooterColumn title="Explore">
              <Link href="/" className={footerLink}>Home</Link>
              <Link href="/events" className={footerLink}>Events</Link>
              <Link href="/constitution" className={footerLink}>Constitution</Link>
              <Link href="/about" className={footerLink}>About</Link>
              <Link href="/join" className={footerLink}>Join Us</Link>
            </FooterColumn>

            <FooterColumn title="Account">
              <Link href="/profile" className={footerLink}>Profile</Link>
              {isAuthenticated ? (
                <Link href="/member" className={footerLink}>Membership</Link>
              ) : (
                <>
                  <Link href="/login" className={footerLink}>Sign In</Link>
                  <Link href="/signup" className={footerLink}>Join</Link>
                </>
              )}
            </FooterColumn>

            <FooterColumn title="AWS">
              <a href="https://aws.amazon.com/education/awseducate/" target="_blank" rel="noopener noreferrer" className={footerLink}>AWS Educate</a>
              <a href="https://aws.amazon.com/training/" target="_blank" rel="noopener noreferrer" className={footerLink}>AWS Training</a>
              <a href="https://aws.amazon.com/getting-started/" target="_blank" rel="noopener noreferrer" className={footerLink}>Getting Started</a>
              <a href="https://aws.amazon.com/certification/" target="_blank" rel="noopener noreferrer" className={footerLink}>Certifications</a>
            </FooterColumn>

            <FooterColumn title="Connect">
              <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className={footerLink}>Discord Server</a>
              <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className={footerLink}>Facebook Page</a>
              <a href={MAILTO} className={footerLink}>Contact Us</a>
            </FooterColumn>
          </div>
        </div>
      </div>

      {/* ── Big wordmark ── */}
      <div className={`${wrap} overflow-hidden`} aria-hidden="true">
        <p className={`${hd} select-none whitespace-nowrap text-center text-[clamp(3.5rem,17vw,15rem)] text-pix-butter`}>
          AWSSBG-UC
        </p>
      </div>

      <Stripes className="h-2" />

      {/* ── Legal / copyright strip ── */}
      <div className={`${wrap} flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between`}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-base text-pix-butter/70">
          <Link href="/privacy" className="transition-colors hover:text-pix-butter hover:underline hover:underline-offset-4">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-pix-butter hover:underline hover:underline-offset-4">Site Terms</Link>
          <span>© {new Date().getFullYear()} AWSSBG-UC. All rights reserved.</span>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`flex items-center gap-2 border-4 border-pix-teal px-3 py-1 text-base transition-colors hover:bg-pix-teal hover:text-black ${focus}`}
        >
          Back to top
          <Icon size={13}><path d="m18 15-6-6-6 6" /></Icon>
        </button>
      </div>
    </footer>
  );
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

export function DashboardShell({
  isAuthenticated,
  isAdmin = false,
  username,
  displayName,
  avatarUrl,
  memberId,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  // Keep header height in sync (handles resize too)
  useEffect(() => {
    function measure() {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen flex-col">

      {/* ── Side grid decorations (behind all content, z-index -1) ── */}
      <SideGrid />

      {/* ── Main header ── */}
      <header ref={headerRef} className={`${px} sticky top-0 z-20 bg-black text-pix-butter`}>
        <div className={wrap}>
          <div className="flex h-[52px] items-center lg:h-[56px]">

            {/* Logo — always visible */}
            <Link href="/" className={`flex shrink-0 items-center gap-2.5 pr-4 ${focus}`}>
              <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className={`${hd} text-3xl`}>
                AWSSBG<span className="text-pix-green">-UC</span>
              </span>
            </Link>

            {/* ── Scrollable nav zone (lg+) ── */}
            <nav
              className="hidden flex-1 items-center gap-1 overflow-x-auto overflow-y-visible scrollbar-none lg:flex"
              aria-label="Main navigation"
            >
              {NAV_ENTRIES.map((entry) => {
                const active = isActivePath(pathname, entry.href);
                const cls = navCls(entry.tone ?? "teal", active);
                return isExternalHref(entry.href) ? (
                  <a key={entry.href} href={entry.href} className={cls}>{entry.label}</a>
                ) : (
                  <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} className={cls}>
                    {entry.label}
                  </Link>
                );
              })}
              <DiscoverDropdown pathname={pathname} />
              <AwsDropdown pathname={pathname} />
              <ContactDropdown pathname={pathname} />
            </nav>

            {/* Spacer on tablet/mobile only */}
            <div className="flex-1 lg:hidden" />

            {/* ── Pinned right actions (lg+) ── */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className={navCls("teal")}
              >
                <Icon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>
                Search
              </button>

              {isAuthenticated ? (
                <ProfileDropdown
                  avatarUrl={avatarUrl}
                  initials={initials}
                  displayName={displayName}
                  username={username}
                  memberId={memberId}
                  pathname={pathname}
                  isAdmin={isAdmin}
                  size={9}
                />
              ) : (
                <>
                  <Link href="/login" className={navCls("green")}>
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className={`ml-1 bg-pix-butter px-4 py-1 text-base text-black shadow-pixel-rust-3 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-1 ${focus}`}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>

            {/* ── Tablet/mobile: avatar dropdown + hamburger ── */}
            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              {isAuthenticated && (
                <ProfileDropdown
                  avatarUrl={avatarUrl}
                  initials={initials}
                  displayName={displayName}
                  username={username}
                  memberId={memberId}
                  pathname={pathname}
                  isAdmin={isAdmin}
                  size={8}
                />
              )}
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav-menu"
                onClick={() => setMobileOpen((o) => !o)}
                className={`flex h-9 w-9 items-center justify-center transition-colors hover:bg-pix-butter hover:text-black ${focus} ${
                  mobileOpen ? "bg-pix-butter text-black" : "text-pix-butter"
                }`}
              >
                {mobileOpen ? (
                  <Icon size={20}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
                ) : (
                  <Icon size={20}>
                    <line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" />
                  </Icon>
                )}
              </button>
            </div>

          </div>
        </div>
        <Stripes className="h-2" />
      </header>

      {/* ── Mobile dropdown menu (portaled, tablet/mobile) ── */}
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        displayName={displayName}
        username={username}
        avatarUrl={avatarUrl}
        initials={initials}
        headerHeight={headerHeight}
      />

      {/* ── Search palette ── */}
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} isAdmin={isAdmin} />}

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}