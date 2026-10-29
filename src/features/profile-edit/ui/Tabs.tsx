"use client";

import { useRef } from "react";
import { focus } from "./pixel";

export interface TabDef<T extends string> {
  id: T;
  label: string;
}

/**
 * Tab bar only; the page renders the matching panel itself (role="tabpanel", id `panel-<id>`,
 * aria-labelledby `tab-<id>`). Left/Right/Home/End move between tabs.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  headingClass,
  actions,
}: {
  tabs: TabDef<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  headingClass: string;
  /** Control at the right end of the bar (e.g. the per-tab Edit button) */
  actions?: React.ReactNode;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-pix-butter/40">
      <div role="tablist" aria-label={label} className="flex gap-2">
        {tabs.map((t, i) => {
          const active = t.id === value;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`${headingClass} -mb-1 border-4 border-b-0 px-4 py-1 text-2xl sm:text-3xl ${focus} ${
                active
                  ? "border-pix-butter bg-pix-butter text-black"
                  : "border-pix-butter/40 text-pix-butter/70 hover:text-pix-butter"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {actions && <div className="pb-2">{actions}</div>}
    </div>
  );
}
