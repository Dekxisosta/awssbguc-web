import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { LegalTabs, type LegalTabKey } from "@/src/widgets/legal-tabs";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";

// Same fonts as the home page. (Rebuilt here rather than imported: this is a server component, and non-component
// exports from the "use client" HomeClient module arrive as client references, not strings.)
const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

export function LegalLayout({
  active,
  title,
  updated,
  children,
}: {
  active: LegalTabKey;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${pixel.className} relative isolate min-h-full bg-black tracking-normal text-[#fff7a1]`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <div className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
          {/* Page header */}
          <p className="text-xl">AWSSBG-UC</p>
          <h1 className={`${hd} mt-3 text-[clamp(4rem,10vw,7rem)]`}>{title}</h1>
          <p className="mt-6 text-lg leading-snug">
            AWS Student Builder Group – University of Cabuyao (Pamantasan ng Cabuyao)
          </p>
          <p className="mt-3 inline-block border-4 border-[#b89a0a] px-3 py-1">
            <span className="text-[#fff7a1]/70">Last updated: </span>
            {updated}
          </p>

          {/* Tabs */}
          <div className="mt-10">
            <LegalTabs active={active} />
          </div>
        </div>

        <Stripes className="h-4" />

        {/* Content */}
        <div className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="space-y-12 text-lg leading-relaxed">{children}</div>
        </div>
        <Stripes className="h-4" />
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className={`${hd} mb-4 border-b-4 border-[#2c8f8f] pb-3 text-4xl text-[#3aaa6e] sm:text-5xl`}>{title}</h2>
      <div className="space-y-4 text-[#fff7a1]/85">{children}</div>
    </section>
  );
}
