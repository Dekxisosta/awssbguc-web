"use client";

import Link from "next/link";

export type LegalTabKey = "terms" | "privacy";

const TABS: { key: LegalTabKey; label: string; href: string }[] = [
  { key: "terms", label: "Terms of Service", href: "/terms" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
];

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

export function LegalTabs({ active }: { active: LegalTabKey }) {
  return (
    <div role="tablist" aria-label="Legal documents" className="flex w-full flex-wrap gap-4">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            scroll={false}
            className={`flex-1 border-4 px-5 py-2 text-center text-lg transition-transform sm:flex-none sm:px-8 ${focus} ${
              isActive
                ? "border-black bg-pix-butter text-black shadow-pixel-teal-4"
                : "border-pix-teal text-pix-butter hover:bg-pix-teal hover:text-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
