"use client";

import { focusRing } from "@/src/features/auth";
import { STEPS, STEP_LABELS, type WizardStep } from "../model/types";

export function StepIndicator({
  current, furthest, onSelect, disabled,
}: {
  current: WizardStep;
  furthest: number;
  onSelect: (s: WizardStep) => void;
  disabled: boolean;
}) {
  const currentIdx = STEPS.indexOf(current);
  return (
    <ol aria-label="Sign-up progress" className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const reachable = !disabled && i <= furthest && !active;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={active ? "step" : undefined}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(s)}
              className={`flex flex-col items-center gap-1 disabled:cursor-default ${focusRing}`}
              aria-label={`${STEP_LABELS[s]}${done ? " (completed)" : ""}`}
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center border-4 text-lg",
                  done ? "border-black bg-pix-green text-black"
                    : active ? "border-black bg-black text-pix-butter"
                    : "border-black/40 text-black/50",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-sm ${active || done ? "text-black" : "text-black/50"}`}>{STEP_LABELS[s]}</span>
            </button>
            {i < STEPS.length - 1 && <div aria-hidden="true" className="mb-5 h-1 flex-1 bg-black/30" />}
          </li>
        );
      })}
    </ol>
  );
}
