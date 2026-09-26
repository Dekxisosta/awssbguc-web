"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MAILTO } from "@/src/shared/config/socials";

type Reaction = "👍" | "❤️" | "🤔" | "🐛";
type Step = "idle" | "open" | "submitted";

const REACTIONS: { emoji: Reaction; label: string }[] = [
  { emoji: "👍", label: "Looks good" },
  { emoji: "❤️", label: "Love it" },
  { emoji: "🤔", label: "Confused" },
  { emoji: "🐛", label: "Bug" },
];

export function FeedbackWidget() {
  const [step, setStep] = useState<Step>("idle");
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [message, setMessage] = useState("");
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(r => [...r, { id, x, y }]);
    setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
  }

  // Focus textarea when panel opens
  useEffect(() => {
    if (step === "open") {
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [step]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step === "open") setStep("idle");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reaction && !message.trim()) return;

    const reactionLabel = reaction
      ? REACTIONS.find((r) => r.emoji === reaction)?.label ?? reaction
      : null;

    const subject = reactionLabel
      ? `[Feedback] ${reaction} ${reactionLabel}`
      : "[Feedback] AWSSBG-UC Website";

    const body = [
      reactionLabel ? `Reaction: ${reaction} ${reactionLabel}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join("\n\n");

    window.location.href = `${MAILTO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStep("submitted");
  }

  function reset() {
    setStep("idle");
    setReaction(null);
    setMessage("");
  }

  return (
    <div className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 flex-col items-end gap-2">
      <AnimatePresence mode="wait">
        {step === "open" && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="w-72 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <p className="text-sm font-semibold text-neutral-100">
                Share feedback
              </p>
              <button
                type="button"
                onClick={() => setStep("idle")}
                aria-label="Close feedback"
                className="rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-200"
              >
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {/* Reaction row */}
              <p className="mb-2 text-xs font-medium text-neutral-400">
                How are you feeling?
              </p>
              <div className="mb-3 flex gap-2">
                {REACTIONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    title={label}
                    aria-pressed={reaction === emoji}
                    onClick={() => setReaction(r => r === emoji ? null : emoji)}
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all",
                      reaction === emoji
                        ? "bg-[#00e482]/15 ring-2 ring-[#00e482] scale-110"
                        : "bg-neutral-800 hover:bg-neutral-700",
                    ].join(" ")}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Text area */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell us what's on your mind…"
                className="w-full resize-none rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00e482]/60"
              />
              <p className="mt-1 text-right text-[10px] text-neutral-400">{message.length}/500</p>

              {/* Submit */}
              <button
                type="submit"
                disabled={!reaction && !message.trim()}
                className="mt-2 w-full rounded-lg bg-[#00e482] py-2 text-sm font-semibold text-[#161d27] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send feedback
              </button>
            </form>
          </motion.div>
        )}

        {step === "submitted" && (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-72 rounded-2xl border border-neutral-700 bg-neutral-900 px-5 py-6 text-center shadow-2xl"
          >
            <p className="text-2xl">🎉</p>
            <p className="mt-2 text-sm font-semibold text-neutral-100">
              Thanks for the feedback!
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              We read every message.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 text-xs text-[#00e482] hover:underline"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button */}
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={(e) => { addRipple(e); step === "idle" ? setStep("open") : setStep("idle"); }}
        aria-label={step === "open" ? "Close feedback" : "Open feedback"}
        aria-expanded={step === "open"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center overflow-hidden rounded-full bg-[#00e482] p-4 text-[#0f1923] shadow-lg transition-shadow hover:shadow-xl"
      >
        {ripples.map(({ id, x, y }) => (
          <span
            key={id}
            className="pointer-events-none absolute animate-ripple rounded-full bg-black/20"
            style={{ left: x, top: y, width: 8, height: 8, transform: "translate(-50%, -50%)" }}
          />
        ))}
        {step === "open" ? <XIcon size={22} /> : <MessageIcon size={22} />}
      </motion.button>
    </div>
  );
}

/* ── Icons ── */

function MessageIcon({ size = 15 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
