import type { ReactNode } from 'react';
import { useI18n } from '@/src/ui/I18nProvider';

/**
 * An ordered list of entries (jobs, schools), most recent first: each in its own box with its number,
 * Move up, Move down and Remove. Order matters: a form's n-th block gets the n-th entry.
 */
export function EntryList<T extends { id: string }>({
  items,
  onChange,
  heading,
  render,
  create,
  addLabel,
  noneLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  /** "Job 2": names the box for screen readers and sighted people alike. */
  heading: (n: number) => string;
  render: (item: T, patch: (change: Partial<T>) => void) => ReactNode;
  create: () => T;
  addLabel: string;
  noneLabel: string;
}) {
  const { t } = useI18n();
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <>
      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={item.id} aria-label={heading(i + 1)} className="rounded-lg border border-line p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="font-display text-sm text-accent tabular-nums">{heading(i + 1)}</span>
              <span className="ml-auto flex gap-1">
                <button
                  className="btn-quiet px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  aria-label={`${t('list.moveUp')}: ${heading(i + 1)}`}
                >
                  ↑
                </button>
                <button
                  className="btn-quiet px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  aria-label={`${t('list.moveDown')}: ${heading(i + 1)}`}
                >
                  ↓
                </button>
                <button
                  className="btn-quiet px-2 py-1 text-xs"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  {t('remove')}
                </button>
              </span>
            </div>
            {render(item, (change) => onChange(items.map((x, j) => (j === i ? { ...x, ...change } : x))))}
          </li>
        ))}
      </ol>
      {items.length === 0 && <p className="text-sm text-ink-faint">{noneLabel}</p>}
      <button className="btn-quiet mt-4" onClick={() => onChange([...items, create()])}>
        {addLabel}
      </button>
    </>
  );
}

/** A labelled box inside an entry. */
export function EntryField({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
