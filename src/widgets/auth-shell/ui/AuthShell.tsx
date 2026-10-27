"use client";

import Image from "next/image";
import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { Stripes, SidePixels, PixelClouds, focus } from "@/src/widgets/home-client";
import { Footer } from "@/src/widgets/dashboard-shell";

/**
 * Frame for the sign-in / sign-up pages, in the pixel-art direction of the home page:
 * black ground, butter type, Jersey 10 headline on the left, and a butter card (black text, hard shadow)
 * on the right that holds the form. The duck and its speech bubble sit under the headline on wide screens.
 */

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

export function AuthShell({
  title,
  sub,
  bubble,
  wide = false,
  children,
}: {
  title: string;
  sub: string;
  /** Short line shown in the duck's speech bubble. */
  bubble: string;
  /** Widen the form column (used for the later sign-up steps). */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${pixel.className} relative isolate min-h-screen bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-page items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className={`flex items-center gap-3 ${focus}`}>
            <Image src="/icons/logo.webp" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className={`${hd} text-3xl`}>AWSSBG-UC</span>
          </Link>
          <Link
            href="/"
            className={`border-4 border-pix-teal px-3 py-1 transition-colors hover:bg-pix-teal hover:text-black ${focus}`}
          >
            Back to home
          </Link>
        </header>

        <Stripes className="h-3" />

        <main
          className={`mx-auto grid w-full max-w-page flex-1 items-center gap-10 px-5 py-12 sm:px-8 lg:gap-16 lg:py-16 ${
            wide ? "lg:grid-cols-[1fr_minmax(0,620px)]" : "lg:grid-cols-[1fr_minmax(0,460px)]"
          }`}
        >
          <div className="text-center lg:text-left">
            <h1 className={`${hd} text-[clamp(4rem,10vw,8rem)]`}>{title}</h1>
            <p className="mx-auto mt-5 max-w-md text-xl leading-snug lg:mx-0">{sub}</p>

            {/* Duck + bubble: decorative, wide screens only so the form stays first on phones. */}
            <div aria-hidden="true" className="relative mt-16 hidden lg:block">
              <div className="absolute bottom-full left-24 mb-3 whitespace-nowrap border-4 border-black bg-pix-butter px-3 py-1 text-lg leading-none text-black shadow-pixel-teal-4">
                {bubble}
                <span className="absolute left-6 top-full h-3 w-3 -translate-y-1/2 rotate-45 border-b-4 border-r-4 border-black bg-pix-butter" />
              </div>
              <Image
                src="/images/additional/duck-engineer.svg"
                alt=""
                width={368}
                height={472}
                unoptimized
                className="h-auto w-44 [image-rendering:pixelated]"
              />
            </div>
          </div>

          <div className="w-full">
            <Stripes className="h-3" />
            <div className="border-4 border-black bg-pix-butter p-6 text-black shadow-pixel-teal-8 sm:p-8">
              {children}
            </div>
          </div>
        </main>

        {/* Same footer as the rest of the site. Nobody is signed in on these pages. */}
        <Footer isAuthenticated={false} />
      </div>
    </div>
  );
}
