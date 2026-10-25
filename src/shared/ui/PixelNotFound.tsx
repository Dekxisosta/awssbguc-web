import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { Stripes } from "@/src/widgets/home-client";

/**
 * "Not found" screen in the pixel-art direction of the site. Used by the public detail routes
 * (/members/[username], /events/[slug]), which render inside the app shell.
 */

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

interface PixelNotFoundProps {
  title: string;
  message: string;
  backHref: string;
  backLabel: string;
}

export function PixelNotFound({ title, message, backHref, backLabel }: PixelNotFoundProps) {
  return (
    <div className={`${pixel.className} bg-black tracking-normal text-[#fff7a1]`}>
      <Stripes className="h-4" />
      <section className="mx-auto flex min-h-[60vh] w-full max-w-[1300px] flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-xl">404</p>
        <h1 className={`${hd} mt-3 max-w-3xl text-[clamp(3.5rem,9vw,7rem)]`}>{title}</h1>
        <p className="mt-6 max-w-xl text-xl leading-snug">{message}</p>
        <div>
          <Link
            href={backHref}
            className={`mt-8 inline-block border-4 border-[#fff7a1] bg-[#fff7a1] px-6 py-3 text-lg text-black shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`}
          >
            {backLabel}
          </Link>
        </div>
      </section>
      <Stripes className="h-4" />
    </div>
  );
}
