"use client";

import Link from "next/link";

export type LegalTabKey = "terms" | "privacy";

const TABS: { key: LegalTabKey; label: string; href: string }[] = [
  { key: "terms", label: "Terms of Service", href: "/terms" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
];

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

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
                ? "border-black bg-[#fff7a1] text-black shadow-[4px_4px_0_#2c8f8f]"
                : "border-[#2c8f8f] text-[#fff7a1] hover:bg-[#2c8f8f] hover:text-black"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
