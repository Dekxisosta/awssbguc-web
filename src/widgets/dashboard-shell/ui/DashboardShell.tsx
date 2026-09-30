"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FeedbackWidget } from "@/src/widgets/feedback-widget";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  isAuthenticated: boolean;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  memberId: string | null;
  children: React.ReactNode;
}

const NAV_ENTRIES: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/events",
    label: "Events",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/join",
    label: "Join Us",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    href: "/members",
    label: "Community",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

// Items collapsed into the "Discover" dropdown
const DISCOVER_ITEMS: NavItem[] = [
  {
    href: "/about",
    label: "About",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" /><path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    href: "/constitution",
    label: "Constitution",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/privacy",
    label: "Privacy",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    href: "/terms",
    label: "Terms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

// AWS resource links for the AWS dropdown
const AWS_RESOURCE_ITEMS: { label: string; href: string; internal?: boolean }[] = [
  { label: "Free Resources",  href: "/aws",                                               internal: true },
  { label: "AWS Console",    href: "https://console.aws.amazon.com/" },
  { label: "Skill Builder",  href: "https://skillbuilder.aws/" },
  { label: "AWS Free Tier",  href: "https://aws.amazon.com/free/" },
  { label: "Builder Labs",   href: "https://aws.amazon.com/training/digital/aws-builder-labs/" },
  { label: "Workshops",      href: "https://workshops.aws/" },
  { label: "Certifications", href: "https://aws.amazon.com/certification/" },
  { label: "Documentation",  href: "https://docs.aws.amazon.com/" },
];

const CONTACT_ITEMS = [
  {
    label: "Discord",
    href: SOCIALS.discord,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    color: "#5865F2",
  },
  {
    label: "Facebook",
    href: SOCIALS.facebook,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "#1877F2",
  },
  {
    label: "Email",
    href: MAILTO,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    color: "#00e482",
  },
];

// ─── Chevron helper ───────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// ─── Desktop: Discover dropdown (portaled) ────────────────────────────────────

function NavDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const isAnyActive = DISCOVER_ITEMS.some((i) => pathname === i.href);

  function handleToggle() {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const dropdown =
    mounted && open && rect
      ? createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-48 border border-neutral-700 bg-neutral-900 py-1 shadow-2xl"
              style={{ zIndex: 99999, top: rect.bottom + 8, left: rect.left }}
            >
              {DISCOVER_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-[#00e482]/10 font-semibold text-[#00e482]"
                        : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
                    ].join(" ")}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isAnyActive
            ? "text-[#00e482]"
            : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
        ].join(" ")}
      >
        Discover
        <Chevron open={open} />
      </button>
      {dropdown}
    </>
  );
}

// ─── Desktop: AWS Resources dropdown (portaled) ───────────────────────────────

function AwsDropdown() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  function handleToggle() {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const dropdown =
    mounted && open && rect
      ? createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-52 border border-[#FF9900]/30 bg-neutral-900 py-1 shadow-2xl"
              style={{ zIndex: 99999, top: rect.bottom + 8, left: rect.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-4 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#FF9900]/60">
                AWS Resources
              </p>
              {AWS_RESOURCE_ITEMS.map((item) =>
                item.internal ? (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[#00e482] transition-colors hover:bg-[#00e482]/10"
                  >
                    {item.label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-70">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-[#FF9900]/10 hover:text-[#FF9900]"
                  >
                    {item.label}
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-50">
                      <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                    </svg>
                  </a>
                )
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          open ? "text-[#FF9900]" : "text-neutral-300 hover:bg-neutral-800 hover:text-[#FF9900]",
        ].join(" ")}
      >
        AWS
        <Chevron open={open} />
      </button>
      {dropdown}
    </>
  );
}

// ─── Desktop: Contact dropdown (portaled) ────────────────────────────────────

function ContactDropdown() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);

  function handleToggle() {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const dropdown =
    mounted && open && rect
      ? createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-44 border border-neutral-700 bg-neutral-900 py-1 shadow-2xl"
              style={{ zIndex: 99999, top: rect.bottom + 8, left: rect.left }}
            >
              {CONTACT_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target={item.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
                  onMouseEnter={(e) => (e.currentTarget.style.color = item.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          open ? "text-neutral-100" : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
        ].join(" ")}
      >
        Contact
        <Chevron open={open} />
      </button>
      {dropdown}
    </>
  );
}

// ─── Aside nav: collapsible section ──────────────────────────────────────────

function AsideSection({
  label,
  labelColor,
  defaultOpen = false,
  children,
}: {
  label: string;
  labelColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-neutral-800/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: labelColor ?? "rgb(82 82 82)" /* neutral-600 */ }}
        >
          {label}
        </span>
        <Chevron open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="aside-section-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Aside panel (portaled) ───────────────────────────────────────────────────

function AsideNav({
  open,
  onClose,
  pathname,
  isAuthenticated,
  displayName,
  username,
  avatarUrl,
  memberId,
  initials,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  isAuthenticated: boolean;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  memberId: string | null;
  initials: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Trap body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="aside-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 100000 }}
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Aside panel */}
          <motion.aside
            key="aside-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-0 top-0 flex h-full w-80 max-w-[calc(100vw-3rem)] flex-col border-l border-neutral-800 bg-neutral-900 shadow-2xl"
            style={{ zIndex: 100001 }}
            aria-label="Navigation menu"
            role="dialog"
            aria-modal="true"
          >
            {/* Panel header */}
            <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-neutral-800 px-4">
              <span className="text-sm font-semibold text-neutral-300">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable nav body */}
            <nav className="flex-1 overflow-y-auto py-2" aria-label="Mobile navigation">

              {/* Top-level links */}
              <div className="px-2">
                {NAV_ENTRIES.map((entry) => {
                  const active = pathname === entry.href;
                  const isExternal = entry.href.startsWith("mailto:") || entry.href.startsWith("http");
                  const cls = [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-[#00e482]/10 font-semibold text-[#00e482]"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
                  ].join(" ");
                  return isExternal ? (
                    <a key={entry.href} href={entry.href} className={cls} onClick={onClose}>
                      {entry.icon}
                      {entry.label}
                    </a>
                  ) : (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      aria-current={active ? "page" : undefined}
                      className={cls}
                      onClick={onClose}
                    >
                      {entry.icon}
                      {entry.label}
                    </Link>
                  );
                })}
              </div>

              {/* Discover — collapsible */}
              <AsideSection
                label="Discover"
                defaultOpen={DISCOVER_ITEMS.some((i) => pathname === i.href)}
              >
                <div className="px-2">
                  {DISCOVER_ITEMS.map((entry) => {
                    const active = pathname === entry.href;
                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                        className={[
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "bg-[#00e482]/10 font-semibold text-[#00e482]"
                            : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
                        ].join(" ")}
                      >
                        {entry.icon}
                        {entry.label}
                      </Link>
                    );
                  })}
                </div>
              </AsideSection>

              <AsideSection label="AWS Resources" labelColor="rgba(255,153,0,0.7)">
                <div className="px-2">
                  {AWS_RESOURCE_ITEMS.map((item) =>
                    item.internal ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#00e482] transition-colors hover:bg-[#00e482]/10"
                      >
                        {item.label}
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-70">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Link>
                    ) : (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-[#FF9900]/10 hover:text-[#FF9900]"
                      >
                        {item.label}
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 opacity-50">
                          <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                        </svg>
                      </a>
                    )
                  )}
                </div>
              </AsideSection>

              {/* Contact — collapsible */}
              <AsideSection label="Contact">
                <div className="px-2">
                  {CONTACT_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith("mailto") ? undefined : "_blank"}
                      rel={item.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                      onMouseEnter={(e) => (e.currentTarget.style.color = item.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                    >
                      <span style={{ color: item.color }}>{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                </div>
              </AsideSection>

            </nav>

            {/* Panel footer — auth actions */}
            <div className="shrink-0 border-t border-neutral-800 px-4 py-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-1">
                  {/* User info row */}
                  <button
                    type="button"
                    onClick={() => { onClose(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-800"
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-700 ring-1 ring-[#00e482]/30">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-200">
                          {initials || "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-200">{displayName}</p>
                      {username && <p className="truncate text-xs text-neutral-500">@{username}</p>}
                    </div>
                  </button>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={onClose}
                    className="rounded-full bg-[#00e482] px-5 py-2.5 text-center text-sm font-bold text-[#161d27] transition-opacity hover:opacity-90"
                  >
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ─── Search palette ───────────────────────────────────────────────────────────

const ALL_SEARCH_ITEMS = [
  // Top-level nav
  { href: "/",            label: "Home",          group: "Pages" },
  { href: "/events",      label: "Events",        group: "Pages" },
  { href: "/join",        label: "Join Us",       group: "Pages" },
  { href: "/members",     label: "Community",     group: "Pages" },
  // Discover
  { href: "/about",       label: "About",         group: "Discover" },
  { href: "/constitution",label: "Constitution",  group: "Discover" },
  { href: "/privacy",     label: "Privacy",       group: "Discover" },
  { href: "/terms",       label: "Terms",         group: "Discover" },
  // AWS
  { href: "/aws",         label: "Free Resources",group: "AWS" },
  // Auth / account
  { href: "/profile",     label: "Profile",       group: "Account" },
  { href: "/member",      label: "Membership",    group: "Account" },
];

function SearchPalette({ onClose }: { onClose: () => void }) {
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

  const filtered = query.trim()
    ? ALL_SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase()) ||
        item.href.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_SEARCH_ITEMS;

  // Group results
  const groups = filtered.reduce<Record<string, typeof ALL_SEARCH_ITEMS>>((acc, item) => {
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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: 100000 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        className="fixed left-1/2 top-[12vh] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl"
        style={{ zIndex: 100001 }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-500" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
          />
          <kbd className="hidden rounded border border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 sm:block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(groups).length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-600">No pages found.</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                  {group}
                </p>
                {items.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-[10px] text-neutral-600">{item.href}</span>
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
  size = 9,
}: {
  avatarUrl: string | null;
  initials: string;
  displayName: string;
  username: string | null;
  memberId: string | null;
  pathname: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  function handleToggle() {
    if (!open && triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen((o) => !o);
  }

  const avatarEl = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-200">
      {initials || "?"}
    </span>
  );

  const dropdown =
    mounted && open && rect
      ? createPortal(
          <>
            <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-56 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl"
              style={{ zIndex: 99999, top: rect.bottom + 8, right: window.innerWidth - rect.right }}
            >
              {/* Identity row */}
              <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-700 ring-2 ring-[#00e482]/30">
                  {avatarEl}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-100">{displayName}</p>
                  {username && <p className="truncate text-[11px] text-neutral-500">@{username}</p>}
                  {memberId && <p className="truncate font-mono text-[10px] text-neutral-600">{memberId}</p>}
                </div>
              </div>

              {/* Nav links */}
              <div className="py-1">
                {PROFILE_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-neutral-800 text-neutral-100"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200",
                    ].join(" ")}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Sign out */}
              <div className="border-t border-neutral-800 py-1">
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={handleToggle}
        className={[
          "shrink-0 overflow-hidden rounded-full bg-neutral-700 ring-2 transition focus:outline-none focus-visible:ring-[#00e482]",
          size === 8 ? "h-8 w-8" : "h-9 w-9",
          open ? "ring-[#00e482]/60" : "ring-transparent hover:ring-[#00e482]/60",
        ].join(" ")}
      >
        {avatarEl}
      </button>
      {dropdown}
    </>
  );
}

const PROFILE_NAV: NavItem[] = [
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
  {
    href: "/member",
    label: "Membership",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
  },
];

// ─── DashboardShell ───────────────────────────────────────────────────────────

export function DashboardShell({
  isAuthenticated,
  username,
  displayName,
  avatarUrl,
  memberId,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close aside and search on route change
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Main header ── */}
      <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-[64px] items-center lg:h-[72px]">

            {/* Logo — always visible */}
            <Link href="/" className="flex shrink-0 items-center gap-3 pr-4">
              <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={36} height={36} className="rounded-md object-contain" />
              <span className="text-base font-extrabold tracking-tight text-neutral-100">
                AWSSBG<span className="text-[#00e482]">-UC</span>
              </span>
            </Link>

            {/* ── Scrollable nav zone (lg+) ── */}
            <nav
              className="hidden flex-1 items-center gap-1 overflow-x-auto overflow-y-visible scrollbar-none lg:flex"
              aria-label="Main navigation"
            >
              {NAV_ENTRIES.map((entry) => {
                const active = pathname === entry.href;
                const isExternal = entry.href.startsWith("mailto:") || entry.href.startsWith("http");
                const cls = [
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-[#00e482]"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
                ].join(" ");
                return isExternal ? (
                  <a key={entry.href} href={entry.href} className={cls}>{entry.label}</a>
                ) : (
                  <Link key={entry.href} href={entry.href} aria-current={active ? "page" : undefined} className={cls}>
                    {entry.label}
                  </Link>
                );
              })}
              <NavDropdown pathname={pathname} />
              <AwsDropdown />
              <ContactDropdown />
            </nav>

            {/* Spacer on tablet/mobile only */}
            <div className="flex-1 lg:hidden" />

            {/* ── Pinned right actions (lg+) ── */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
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
                  size={9}
                />
              ) : (
                <>
                  <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:text-neutral-100">
                    Sign in
                  </Link>
                  <Link href="/signup" className="rounded-full bg-[#00e482] px-5 py-2 text-sm font-bold text-[#161d27] transition-opacity hover:opacity-90">
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
                  size={8}
                />
              )}
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="aside-nav-panel"
                onClick={() => setMobileOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-neutral-800"
              >
                {mobileOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Aside nav panel (portaled, tablet/mobile) ── */}
      <AsideNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        displayName={displayName}
        username={username}
        avatarUrl={avatarUrl}
        memberId={memberId}
        initials={initials}
      />

      {/* ── Search palette ── */}
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Feedback widget ── */}
      <FeedbackWidget />

      {/* ── Footer ── */}
      <footer className="bg-neutral-950" aria-label="Site footer">
        {/* Wave divider */}
        <div className="overflow-hidden leading-none bg-neutral-900 text-neutral-950" aria-hidden="true">
          <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="block h-12 w-full sm:h-16">
            <path d="M0,32 C180,64 360,0 540,32 C720,64 900,0 1080,32 C1260,64 1380,16 1440,24 L1440,64 L0,64 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="bg-neutral-950">

          {/* ── Main link columns ── */}
          <div className="mx-auto max-w-5xl px-6 pt-10 pb-12">
            <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">

              {/* Explore */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-neutral-100">Explore</p>
                <Link href="/" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Home</Link>
                <Link href="/events" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Events</Link>
                <Link href="/constitution" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Constitution</Link>
                <Link href="/about" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">About</Link>
                <Link href="/join" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Join Us</Link>
              </div>

              {/* Account */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-neutral-100">Account</p>
                <Link href="/profile" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Profile</Link>
                {isAuthenticated && (
                  <Link href="/member" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Membership</Link>
                )}
                {!isAuthenticated && (
                  <>
                    <Link href="/login" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Sign In</Link>
                    <Link href="/signup" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Join</Link>
                  </>
                )}
              </div>

              {/* AWS Resources */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-neutral-100">AWS Resources</p>
                <a href="https://aws.amazon.com/education/awseducate/" target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">AWS Educate</a>
                <a href="https://aws.amazon.com/training/" target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">AWS Training</a>
                <a href="https://aws.amazon.com/getting-started/" target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Getting Started</a>
                <a href="https://aws.amazon.com/certification/" target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Certifications</a>
              </div>

              {/* Connect */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-neutral-100">Connect</p>
                <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Discord Server</a>
                <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Facebook Page</a>
                <a href={MAILTO} className="text-base text-neutral-400 transition-colors hover:text-neutral-100">Contact Us</a>
              </div>

            </div>
          </div>

          {/* ── Brand + social row ── */}
          <div className="border-t border-neutral-800">
            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start sm:justify-between">

              {/* Logo + description */}
              <div className="flex items-start gap-4">
                <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={120} height={120} className="shrink-0 rounded-xl object-contain" />
                <div>
                  <p className="text-base font-bold tracking-tight text-neutral-100">AWSSBG-UC</p>
                  <p className="mt-0.5 text-xs font-medium text-neutral-400">AWS Student Builder Group — UC</p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
                    A student-led community at the University of Cabuyao dedicated to building cloud skills, sharing knowledge, and connecting AWS enthusiasts across campus.
                  </p>
                </div>
              </div>

              {/* Connect with us */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Connect with us</p>
                <div className="flex items-center gap-2">
                  <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" aria-label="Discord server"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-[#5865F2]/10 hover:text-[#5865F2]">
                    <DiscordIcon />
                  </a>
                  <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook page"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-[#1877F2]/10 hover:text-[#1877F2]">
                    <FacebookIcon />
                  </a>
                  <a href={MAILTO} aria-label="Email us"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-[#00e482]/10 hover:text-[#00e482]">
                    <EmailIcon />
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* ── Legal / copyright strip ── */}
          <div className="border-t border-neutral-800">
            <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 py-4 sm:flex-row sm:justify-between">

              {/* Back to top */}
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-100 sm:order-last"
              >
                Back to top
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <a href="/privacy" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">Privacy</a>
                <a href="/terms" className="text-sm text-neutral-500 transition-colors hover:text-neutral-300">Site Terms</a>
                <span className="text-sm text-neutral-600">© {new Date().getFullYear()} AWSSBG-UC. All rights reserved.</span>
              </div>

            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
