import { useEffect, useState } from 'react';
import { useI18n } from '@/src/ui/I18nProvider';
import { LANGUAGES, isLang, type MessageKey } from '@/src/ui/i18n';
import { PALETTES, type Palette } from '@/src/ui/palette';
import type { Profile } from '@/src/profile/schema';
import { completion, documentsProgress, OPTIONAL_SECTIONS, sectionProgress, type Progress } from './completion';
import { FIELD_SECTIONS } from './fields';
import { BackupSection } from './sections/BackupSection';
import { CustomAnswersSection } from './sections/CustomAnswersSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { FieldSection } from './sections/FieldSection';
import { usePalette } from './usePalette';
import { useProfile } from './useProfile';

const EXTRA_SECTIONS: { id: string; title: MessageKey; navTitle?: MessageKey }[] = [
  { id: 'documents', title: 'section.documents' },
  { id: 'answers', title: 'section.answers', navTitle: 'section.answers.nav' },
  { id: 'data', title: 'section.backup', navTitle: 'section.backup.nav' },
];

const SECTIONS = [...FIELD_SECTIONS, ...EXTRA_SECTIONS];

/** The section being read: the first one whose top is in the upper part of the window. */
function useSectionInView(ready: boolean): [string, (id: string) => void] {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    if (!ready) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = SECTIONS.find((s) => visible.has(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: '-64px 0px -60% 0px' },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ready]);
  return [active, setActive];
}

function progressOf(id: string, profile: Profile): Progress | null {
  const section = FIELD_SECTIONS.find((s) => s.id === id);
  if (section) return OPTIONAL_SECTIONS.has(id) ? null : sectionProgress(section, profile);
  return id === 'documents' ? documentsProgress(profile) : null;
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5M10 2.5C8 4.7 7 7.2 7 10s1 5.3 3 7.5" />
    </svg>
  );
}

/** A row of swatches, each the palette's paper cut diagonally with its accent. Plain radios underneath. */
function PalettePicker() {
  const { t } = useI18n();
  const [palette, setPalette] = usePalette();
  return (
    <div role="radiogroup" aria-labelledby="palette-label" className="flex items-center gap-3 text-sm text-ink-soft">
      <span id="palette-label">{t('options.palette')}</span>
      <div className="flex gap-2">
        {(Object.keys(PALETTES) as Palette[]).map((id) => (
          <label key={id} title={t(PALETTES[id].name)} className="cursor-pointer">
            <input
              type="radio"
              name="palette"
              value={id}
              checked={palette === id}
              onChange={() => setPalette(id)}
              aria-label={t(PALETTES[id].name)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="block size-6 rounded-full border border-line-strong ring-offset-2 ring-offset-paper transition peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-5 peer-focus-visible:outline-accent hover:scale-110 motion-reduce:hover:scale-100"
              style={{ background: `linear-gradient(135deg, ${PALETTES[id].paper} 50%, ${PALETTES[id].accent} 50%)` }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { profile, state, justSaved, update } = useProfile();
  const { lang, t, setLang } = useI18n();
  const [active, setActive] = useSectionInView(Boolean(profile));

  useEffect(() => {
    document.title = t('options.pageTitle');
  }, [t]);

  if (!profile) return <p className="p-8 text-sm text-ink-soft">{t('options.loading')}</p>;

  const percent = completion(profile);
  const numbered = (id: string) => SECTIONS.findIndex((s) => s.id === id) + 1;
  const count = (id: string) => {
    const progress = progressOf(id, profile);
    if (progress) return t('section.count', { filled: progress.filled, total: progress.total });
    return OPTIONAL_SECTIONS.has(id) ? t('section.optional') : undefined;
  };

  return (
    // On wide screens the sheet sits in the middle of the window, with the index against its left
    // edge and an equal empty column on the right; narrower screens put the two side by side.
    <div className="mx-auto max-w-6xl px-4 md:grid md:grid-cols-[15.5rem_minmax(0,1fr)] md:gap-12 md:px-8 xl:max-w-none xl:grid-cols-[minmax(15.5rem,1fr)_minmax(0,52rem)_minmax(15.5rem,1fr)]">
      {/* The index: one row that sticks to the top on small screens, a column beside the sheet on wide ones. */}
      <aside className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-2 backdrop-blur md:mx-0 md:h-screen md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:bg-transparent md:px-0 md:py-8 md:backdrop-blur-none xl:w-[15.5rem] xl:justify-self-end">
        <div className="hidden items-center gap-2.5 md:flex">
          <img src="/icon/48.png" alt="" className="size-7 rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight">LocalApply</span>
        </div>

        <div className="hidden md:mt-10 md:block">
          <p className="font-display text-5xl leading-none font-medium tracking-tight tabular-nums">
            {percent}
            <span className="text-2xl text-ink-soft">%</span>
          </p>
          <p className="mt-2 text-sm text-ink-soft">{t('options.completeLabel')}</p>
          <div
            role="progressbar"
            aria-label={t('options.completeLabel')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-3 h-1 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-faint">{t('options.completeHint')}</p>
        </div>

        <nav
          aria-label={t('options.sections')}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] md:mt-8 md:flex-none md:flex-col md:gap-0 md:overflow-visible"
        >
          {SECTIONS.map((s) => {
            const current = s.id === active;
            const meta = count(s.id);
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={current ? 'location' : undefined}
                onClick={() => setActive(s.id)}
                className={`flex shrink-0 items-baseline gap-3 rounded-md px-2.5 py-1.5 text-sm transition md:rounded-none md:border-l-2 md:py-2 md:pr-0 md:pl-3.5 ${
                  current
                    ? 'bg-sheet font-medium text-ink md:border-accent md:bg-transparent'
                    : 'text-ink-soft hover:text-ink md:border-line md:hover:border-ink-faint'
                }`}
              >
                <span className="hidden font-display text-xs text-ink-faint tabular-nums md:inline">
                  {String(numbered(s.id)).padStart(2, '0')}
                </span>
                <span className="md:hidden">{t(s.navTitle ?? s.title)}</span>
                <span className="hidden min-w-0 truncate md:inline">{t(s.title)}</span>
                {meta && (
                  <span className="ml-auto hidden shrink-0 pl-2 text-xs font-normal text-ink-faint tabular-nums md:inline">
                    {meta}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* After each save it turns green with a check for a moment, then fades back. */}
        <span
          role="status"
          className={`inline-flex shrink-0 items-center gap-1.5 self-center rounded-full px-2.5 py-1 text-xs md:mt-auto md:self-start ${
            state === 'error'
              ? 'font-medium text-danger'
              : justSaved
                ? 'save-pop bg-accent-soft font-medium text-accent transition-none'
                : 'text-ink-faint transition-colors duration-700 motion-reduce:transition-none'
          }`}
        >
          {justSaved && state === 'saved' && <CheckIcon />}
          {t(state === 'saving' ? 'options.saving' : state === 'error' ? 'options.saveError' : 'options.saved')}
        </span>
      </aside>

      <main className="pb-20 md:py-8">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-6 pb-8 md:pt-1">
          <div className="min-w-0 flex-1 basis-80">
            <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{t('options.title')}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">{t('options.subtitle')}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 md:items-end">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <GlobeIcon />
              <span>{t('options.language')}</span>
              <select
                className="field w-auto py-1.5"
                value={lang}
                onChange={(e) => {
                  if (isLang(e.target.value)) setLang(e.target.value);
                }}
              >
                {LANGUAGES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <PalettePicker />
          </div>
        </header>

        <div className="rounded-xl border border-line bg-sheet">
          {FIELD_SECTIONS.map((section) => (
            <FieldSection
              key={section.id}
              section={section}
              number={numbered(section.id)}
              meta={count(section.id)}
              profile={profile}
              update={update}
            />
          ))}
          <DocumentsSection
            number={numbered('documents')}
            meta={count('documents')}
            profile={profile}
            update={update}
          />
          <CustomAnswersSection number={numbered('answers')} profile={profile} update={update} />
          <BackupSection number={numbered('data')} profile={profile} update={update} />
        </div>
      </main>
    </div>
  );
}
