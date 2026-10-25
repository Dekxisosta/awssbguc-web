"use client";

import { useEffect, useRef } from "react";

/**
 * Draws an image at a tiny resolution and scales it up with hard edges, the same treatment the home
 * page and member directory give avatars, so this is also a faithful preview of how others see you.
 */
export function PixelAvatar({ src, size = 32 }: { src: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      const k = Math.max(size / img.width, size / img.height); // cover
      const w = img.width * k;
      const h = img.height * k;
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      aria-hidden="true"
      className="block h-full w-full [image-rendering:pixelated]"
    />
  );
}
