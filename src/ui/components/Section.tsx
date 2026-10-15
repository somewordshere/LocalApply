import type { ReactNode } from 'react';

/** A titled card on the profile page; `id` is the anchor the section navigation links to. */
export function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id={`${id}-title`} className="text-base font-semibold">
        {title}
      </h2>
      {note && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
