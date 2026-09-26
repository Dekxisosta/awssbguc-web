"use client";

import Link from "next/link";

export type LegalTabKey = "terms" | "privacy";

const TABS: { key: LegalTabKey; label: string; href: string }[] = [
  { key: "terms", label: "Terms of Service", href: "/terms" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
];

export function LegalTabs({ active }: { active: LegalTabKey }) {
  return (
    <div
      role="tablist"
      aria-label="Legal documents"
      className="flex w-full gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1 sm:w-fit"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            scroll={false}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-6 ${
              isActive
                ? "bg-neutral-800 text-neutral-50 shadow-sm"
                : "text-neutral-400 hover:text-neutral-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
