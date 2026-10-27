"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, focus } from "./pixel";

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Font class of the page wrapper: the portal renders outside it, so it has to be re-applied. */
  bodyClass: string;
  headingClass: string;
  /** "dark" = black panel (default), "butter" = yellow panel with black text. */
  tone?: "dark" | "butter";
  /** Wider panel for forms. */
  wide?: boolean;
  /** Close when the backdrop is clicked. Off for forms so a stray click can't discard a draft. */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}

/**
 * Rendered only while open (parents mount/unmount it), so it can portal straight to document.body.
 * The portal matters: the page wrapper is `isolate`d, which would otherwise keep a plain `fixed`
 * overlay underneath the site's sticky header.
 */
export function Modal({
  title,
  onClose,
  bodyClass,
  headingClass,
  tone = "dark",
  wide = false,
  closeOnBackdrop = false,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return; // inline editors cancel themselves first
      if (dialogRef.current?.querySelector('[role="dialog"]')) return; // a nested dialog (photo cropper) owns Escape
      onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnTo?.focus?.();
    };
  }, []);

  const dark = tone === "dark";

  return createPortal(
    <div
      className={`${bodyClass} fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 p-4 tracking-normal`}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full flex-col border-4 outline-none shadow-pixel-teal-8 ${
          wide ? "max-w-2xl" : "max-w-sm"
        } ${dark ? "border-pix-butter bg-black text-pix-butter" : "border-black bg-pix-butter text-black"}`}
      >
        <div className={`flex shrink-0 items-center justify-between gap-4 border-b-4 px-5 py-3 ${dark ? "border-pix-butter" : "border-black"}`}>
          <h2 id={titleId} className={`${headingClass} text-4xl`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center border-4 transition-colors ${focus} ${
              dark ? "border-pix-butter hover:bg-pix-butter hover:text-black" : "border-black hover:bg-black hover:text-pix-butter"
            }`}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
