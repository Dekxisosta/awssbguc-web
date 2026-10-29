/** Bordered block with a headline, like the "Why join?" pillars on the home page. Compact on desktop. */
export function Tile({
  id,
  title,
  border,
  headingClass,
  className = "",
  action,
  children,
}: {
  id: string;
  title: string;
  border: string;
  headingClass: string;
  /** Extra classes for the section (e.g. grid spans) */
  className?: string;
  /** Control shown at the right of the heading (e.g. an Edit button) */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`min-w-0 scroll-mt-6 border-4 ${border} p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className={`${headingClass} text-3xl sm:text-4xl`}>
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
