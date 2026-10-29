"use client";

import { useState } from "react";
import { Tabs, type TabDef } from "@/src/features/profile-edit/ui/Tabs";

type TabId = "showcase" | "details";

const TABS: TabDef<TabId>[] = [
  { id: "showcase", label: "Showcase" },
  { id: "details", label: "Details" },
];

/**
 * Tab switcher for the public member page, same tab bar as /profile. The panels are rendered on the
 * server and passed in, so only the active-tab state lives on the client.
 */
export function MemberTabs({
  showcase,
  details,
  defaultTab,
  headingClass,
}: {
  showcase: React.ReactNode;
  details: React.ReactNode;
  defaultTab: TabId;
  headingClass: string;
}) {
  const [tab, setTab] = useState<TabId>(defaultTab);

  return (
    <div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Member sections" headingClass={headingClass} />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === "showcase" ? showcase : details}
      </div>
    </div>
  );
}
