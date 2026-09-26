import { LegalTabs, type LegalTabKey } from "@/src/widgets/legal-tabs";

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
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Page header */}
      <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        AWS Student Builder Group – University of Cabuyao (Pamantasan ng Cabuyao) &nbsp;·&nbsp; Last
        Updated: {updated}
      </p>

      {/* Tabs */}
      <div className="mt-6">
        <LegalTabs active={active} />
      </div>

      {/* Content */}
      <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-200">
        {children}
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
      <h2 className="mb-2 text-base font-semibold text-neutral-100">{title}</h2>
      <div className="space-y-3 text-neutral-300">{children}</div>
    </section>
  );
}
