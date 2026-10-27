"use client";

import { useEffect, useRef, useState } from "react";
import { errTxt, focusRing } from "@/src/features/auth";
import { AVATAR_MIME } from "../model/validateStep";

/**
 * Holds the chosen image in memory only. Nothing is uploaded until the account
 * exists (the upload endpoint needs a signed-in user).
 */
export function AvatarPicker({
  file, onChange, error, disabled,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="flex flex-col items-center gap-2 border-4 border-black bg-black p-4 text-pix-butter">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label={file ? "Change profile photo" : "Choose a profile photo"}
        className={`flex h-24 w-24 items-center justify-center overflow-hidden border-4 border-pix-butter bg-pix-butter/10 text-sm ${focusRing}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : "Add photo"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_MIME.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-3 text-sm text-pix-butter/70">
        <span>JPEG, PNG, GIF or WebP, up to 2 MB.</span>
        {file && (
          <button type="button" disabled={disabled} onClick={() => onChange(null)} className={`underline ${focusRing}`}>
            Remove
          </button>
        )}
      </div>
      {error && <p role="alert" className={`${errTxt} text-pix-blush`}>{error}</p>}
    </div>
  );
}
