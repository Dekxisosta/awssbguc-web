"use client";

/**
 * AvatarUpload
 *
 * Full pipeline:
 *   1. User clicks avatar or "Change photo" → file picker opens.
 *   2. Input validation: JPEG / PNG / GIF / WebP, max 10 MB.
 *   3. Image loaded into a hidden <img> tag.
 *   4. react-image-crop renders a 1:1 square crop UI in a modal.
 *   5. "Apply crop" draws the cropped region onto a canvas,
 *      resizes to max 1600×1600, compresses to WebP at q=0.85
 *      — retrying at lower quality until ≤ 2 MB.
 *   6. Compressed blob POSTed to /api/profile/avatar.
 *   7. On success the parent receives the new URL via onAvatarChange.
 *   8. "Remove photo" calls DELETE /api/profile/avatar.
 */

import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const INPUT_MAX_BYTES = 10 * 1024 * 1024;
const OUTPUT_MAX_BYTES = 2 * 1024 * 1024;
const OUTPUT_MAX_PX = 1600;
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ACCEPTED_ATTR = ".jpg,.jpeg,.png,.gif,.webp";
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.40;

type Phase = "idle" | "cropping" | "processing" | "uploading" | "removing";

interface AvatarUploadProps {
  avatarUrl: string | null;
  username: string | null;
  onAvatarChange: (url: string | null) => void;
}

function initCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
    width,
    height
  );
}

async function compressCrop(
  sourceImage: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const scaleX = sourceImage.naturalWidth / sourceImage.width;
  const scaleY = sourceImage.naturalHeight / sourceImage.height;

  const sx = crop.x * scaleX;
  const sy = crop.y * scaleY;
  const sw = crop.width * scaleX;
  const sh = crop.height * scaleY;

  const longerSide = Math.max(sw, sh);
  const scale = longerSide > OUTPUT_MAX_PX ? OUTPUT_MAX_PX / longerSide : 1;
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas 2D context.");

  ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, dw, dh);

  let quality = INITIAL_QUALITY;
  while (quality >= MIN_QUALITY) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
        "image/webp",
        quality
      );
    });
    if (blob.size <= OUTPUT_MAX_BYTES) return blob;
    quality -= 0.10;
  }

  const fallback = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/webp",
      MIN_QUALITY
    );
  });
  if (fallback.size > OUTPUT_MAX_BYTES) {
    throw new Error(
      `Image is too large to compress under 2 MB even at minimum quality. ` +
        `Please choose a smaller or simpler image.`
    );
  }
  return fallback;
}

export function AvatarUpload({ avatarUrl, username, onAvatarChange }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
    };
  }, [srcUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setError(null);

      if (!ACCEPTED_MIME.includes(file.type)) {
        setError("Unsupported file type. Please choose a JPEG, PNG, GIF, or WebP image.");
        return;
      }
      if (file.size > INPUT_MAX_BYTES) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum input size is 10 MB.`);
        return;
      }

      if (srcUrl) URL.revokeObjectURL(srcUrl);
      setSrcUrl(URL.createObjectURL(file));
      setCrop(undefined);
      setCompletedCrop(undefined);
      setPhase("cropping");
    },
    [srcUrl]
  );

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(initCrop(width, height));
    },
    []
  );

  const handleApplyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    setError(null);
    setPhase("processing");

    let blob: Blob;
    try {
      blob = await compressCrop(imgRef.current, completedCrop);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed.");
      setPhase("idle");
      return;
    }

    setPhase("uploading");
    const form = new FormData();
    form.append("file", blob, "avatar.webp");

    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Upload failed.");
        setPhase("idle");
        return;
      }
      onAvatarChange(data.avatarUrl);
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      setSrcUrl(null);
      setPhase("idle");
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }, [completedCrop, srcUrl, onAvatarChange]);

  const handleCancelCrop = useCallback(() => {
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    setSrcUrl(null);
    setPhase("idle");
  }, [srcUrl]);

  const handleRemove = useCallback(async () => {
    setError(null);
    setPhase("removing");
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Could not remove photo.");
        setPhase("idle");
        return;
      }
      onAvatarChange(null);
    } catch {
      setError("Network error. Please try again.");
    }
    setPhase("idle");
  }, [onAvatarChange]);

  const busy = phase === "processing" || phase === "uploading" || phase === "removing";
  const busyLabel =
    phase === "processing" ? "Processing…" :
    phase === "uploading"  ? "Uploading…" :
    phase === "removing"   ? "Removing…" : "";

  const userInitials = username ? username[0].toUpperCase() : "?";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => !busy && fileInputRef.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-neutral-700 bg-neutral-800 transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:pointer-events-none disabled:opacity-50"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Profile photo" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-neutral-300">
            {userInitials || "?"}
          </span>
        )}

        {!busy && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <CameraIcon />
          </span>
        )}

        {busy && (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60"
          >
            <SpinnerIcon />
          </span>
        )}
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? busyLabel : "Change photo"}
        </button>

        {avatarUrl && !busy && (
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-md px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex w-full max-w-xs items-start gap-2 rounded-md border border-red-800 bg-red-950/50 px-3 py-2 text-xs text-red-400"
        >
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="shrink-0 text-red-500 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {phase === "cropping" && srcUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Crop profile photo"
        >
          <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-neutral-100">
              Crop photo
            </h2>
            <p className="text-xs text-neutral-500">
              Drag to reposition. The crop area is always square.
            </p>
            <div className="max-h-[60vh] overflow-auto rounded-lg bg-neutral-900">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
                keepSelection
                minWidth={40}
                minHeight={40}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={srcUrl}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  style={{ maxWidth: "100%", display: "block" }}
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-md border border-neutral-700 px-4 py-2 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={!completedCrop || completedCrop.width === 0}
                className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
