const MAX_PX = 1600;
const MAX_BYTES = 2 * 1024 * 1024;
const START_QUALITY = 0.85;
const MIN_QUALITY = 0.4;

export const PICTURE_INPUT_MAX_BYTES = 10 * 1024 * 1024;
export const PICTURE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const ACCEPTED = new Set(PICTURE_ACCEPT.split(","));

/** Resolves to an error message when the file can't be used, or null when it is fine. */
export function checkPictureFile(file: File): string | null {
  if (!ACCEPTED.has(file.type)) return "Unsupported file type. Choose a JPEG, PNG, GIF, or WebP image.";
  if (file.size > PICTURE_INPUT_MAX_BYTES) return "That file is too large. Maximum is 10 MB.";
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), "image/webp", quality),
  );
}

/**
 * Downscale to at most 1600px on the longer side and re-encode as WebP (≤ 2 MB), keeping the original
 * aspect ratio (screenshots aren't square, so there is no crop step). Animated GIFs become a still frame.
 */
export async function compressPicture(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const longer = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longer > MAX_PX ? MAX_PX / longer : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that image.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = START_QUALITY;
  for (;;) {
    const blob = await toBlob(canvas, quality);
    if (blob.size <= MAX_BYTES) return blob;
    if (quality <= MIN_QUALITY) throw new Error("That image is too large to compress. Try a smaller one.");
    quality = Math.max(MIN_QUALITY, quality - 0.1);
  }
}
