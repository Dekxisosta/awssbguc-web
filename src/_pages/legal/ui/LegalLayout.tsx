import { bodyFont, hd } from "@/src/shared/config/fonts";
import { LegalTabs, type LegalTabKey } from "@/src/widgets/legal-tabs";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";

// Same fonts as the home page. (Rebuilt here rather than imported: this is a server component, and non-component
// exports from the "use client" HomeClient module arrive as client references, not strings.)

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
    <div className={`${bodyFont.className} relative isolate min-h-full bg-black tracking-normal text-pix-butter`}>
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
          <p className="mt-3 inline-block border-4 border-pix-mustard px-3 py-1">
            <span className="text-pix-butter/70">Last updated: </span>
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
      <h2 className={`${hd} mb-4 border-b-4 border-pix-teal pb-3 text-4xl text-pix-green sm:text-5xl`}>{title}</h2>
      <div className="space-y-4 text-pix-butter/85">{children}</div>
    </section>
  );
}
