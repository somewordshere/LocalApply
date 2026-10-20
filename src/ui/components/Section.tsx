import type { ReactNode } from 'react';

/**
 * One part of the profile sheet: a numbered heading, an optional note and the fields.
 * Parts are divided by a hairline rather than boxed; `id` is the anchor the index links to.
 */
export function Section({
  id,
  number,
  title,
  meta,
  note,
  children,
}: {
  id: string;
  /** Position in the sheet, shown as "01". */
  number?: number;
  title: string;
  /** Short status at the right of the heading, such as "5 of 7". */
  meta?: ReactNode;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 border-t border-line px-6 py-8 first:border-t-0 md:scroll-mt-8 md:px-10 md:py-10"
    >
      <header className="mb-6 flex items-baseline gap-3">
        {number !== undefined && (
          <span aria-hidden="true" className="font-display text-sm text-accent tabular-nums">
            {String(number).padStart(2, '0')}
          </span>
        )}
        <h2 id={`${id}-title`} className="font-display text-2xl font-medium tracking-tight">
          {title}
        </h2>
        {meta && <span className="ml-auto text-sm text-ink-faint tabular-nums">{meta}</span>}
      </header>
      {note && <p className="-mt-3 mb-6 max-w-prose text-sm text-ink-soft">{note}</p>}
      {children}
    </section>
  );
}
