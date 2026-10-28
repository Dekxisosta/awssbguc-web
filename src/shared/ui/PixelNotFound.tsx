import Link from "next/link";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Stripes } from "@/src/widgets/home-client";

/**
 * "Not found" screen in the pixel-art direction of the site. Used by the public detail routes
 * (/members/[username], /events/[slug]), which render inside the app shell.
 */

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

interface PixelNotFoundProps {
  title: string;
  message: string;
  backHref: string;
  backLabel: string;
}

export function PixelNotFound({ title, message, backHref, backLabel }: PixelNotFoundProps) {
  return (
    <div className={`${bodyFont.className} bg-black tracking-normal text-pix-butter`}>
      <Stripes className="h-4" />
      <section className="mx-auto flex min-h-[60vh] w-full max-w-page flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-xl">404</p>
        <h1 className={`${hd} mt-3 max-w-3xl text-[clamp(3.5rem,9vw,7rem)]`}>{title}</h1>
        <p className="mt-6 max-w-xl text-xl leading-snug">{message}</p>
        <div>
          <Link
            href={backHref}
            className={`mt-8 inline-block border-4 border-pix-butter bg-pix-butter px-6 py-3 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`}
          >
            {backLabel}
          </Link>
        </div>
      </section>
      <Stripes className="h-4" />
    </div>
  );
}
