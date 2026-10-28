/**
 * Profile avatar shown at full quality (no pixelation). Kept under its old name so ProfileCard still
 * imports it; `size` is now unused but accepted for compatibility.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PixelAvatar({ src, size: _size = 32 }: { src: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden="true" decoding="async" className="block h-full w-full object-cover" />
  );
}
