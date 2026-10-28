import { useEffect, useState, type ReactNode } from 'react';
import { browser } from 'wxt/browser';
import { useI18n } from '@/src/ui/I18nProvider';
import { LANGUAGES, isLang, type MessageKey } from '@/src/ui/i18n';
import { currentPalette, iconPath } from '@/src/ui/palette';

const DEFAULT_SHORTCUT = 'Alt+Shift+F';

/** The fill shortcut as the browser has it now: the person may have changed it, or it may clash and be unset. */
function useShortcut(): string {
  const [shortcut, setShortcut] = useState(DEFAULT_SHORTCUT);
  useEffect(() => {
    void browser.commands
      .getAll()
      .then((all) => setShortcut(all.find((c) => c.name === 'fill-form')?.shortcut || DEFAULT_SHORTCUT))
      .catch(() => {});
  }, []);
  return shortcut;
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="mt-1 size-4 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
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

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-line px-5 py-6 last:border-b-0 md:px-8">
      <span className="font-display text-3xl leading-none font-medium text-accent tabular-nums">{number}</span>
      <div>
        <h3 className="font-display text-xl font-medium tracking-tight">{title}</h3>
        <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink-soft">{children}</div>
      </div>
    </li>
  );
}

/** Two form boxes drawn the way a filled page looks: one filled, one left for the applicant. */
function OutlineSample() {
  const { t } = useI18n();
  return (
    <div
      aria-hidden="true"
      className="grid max-w-md gap-2 rounded-lg border border-line bg-paper p-3 text-sm sm:grid-cols-2"
    >
      <div>
        <p className="mb-1 text-xs text-ink-faint">{t('field.email')}</p>
        <div className="rounded-md border-2 border-solid border-[#16a34a] bg-sheet px-2 py-1.5 text-ink">
          jane@example.com
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs text-ink-faint">{t('welcome.sampleQuestion')}</p>
        <div className="h-[34px] rounded-md border-2 border-dashed border-[#d97706] bg-sheet" />
      </div>
    </div>
  );
}

const ALSO: MessageKey[] = ['welcome.learn', 'welcome.menu', 'welcome.log', 'welcome.profiles', 'welcome.placeholders'];

export default function App() {
  const { lang, t, setLang } = useI18n();
  const shortcut = useShortcut();

  useEffect(() => {
    document.title = t('welcome.pageTitle');
  }, [t]);

  const openProfile = () => void browser.runtime.openOptionsPage();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 py-6">
        <span className="flex items-center gap-2.5">
          <img src={iconPath(currentPalette(), 48)} alt="" className="size-7 rounded-md" />
          <span className="font-display text-lg font-semibold tracking-tight">LocalApply</span>
        </span>
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
      </header>

      <main>
        <section className="pt-6 pb-10 md:pt-12">
          <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{t('welcome.title')}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{t('welcome.subtitle')}</p>
          <button className="btn mt-8 px-6 py-3 text-[15px]" onClick={openProfile}>
            {t('welcome.start')}
          </button>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="mb-4 font-display text-2xl font-medium tracking-tight">
            {t('welcome.how')}
          </h2>
          <ol className="rounded-xl border border-line bg-sheet">
            <Step number={1} title={t('welcome.step1.title')}>
              <p>{t('welcome.step1.text')}</p>
            </Step>
            <Step number={2} title={t('welcome.step2.title')}>
              <p>{t('welcome.step2.text')}</p>
              <p>
                {t('welcome.step2.shortcut')}{' '}
                <kbd className="rounded border border-line-strong bg-paper px-1.5 py-0.5 font-sans text-sm text-ink">
                  {shortcut}
                </kbd>
              </p>
              <p className="text-sm text-ink-faint">{t('welcome.step2.pin')}</p>
            </Step>
            <Step number={3} title={t('welcome.step3.title')}>
              <p>{t('welcome.step3.text')}</p>
              <OutlineSample />
            </Step>
          </ol>
        </section>

        <section aria-labelledby="also" className="mt-12">
          <h2 id="also" className="mb-4 font-display text-2xl font-medium tracking-tight">
            {t('welcome.also')}
          </h2>
          <ul className="space-y-3 text-[15px] leading-relaxed">
            {ALSO.map((key) => (
              <li key={key} className="flex gap-3">
                <CheckIcon />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-accent/30 bg-accent-soft px-5 py-5 md:px-8">
          <h2 className="font-display text-xl font-medium tracking-tight">{t('welcome.privacy.title')}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{t('welcome.privacy.text')}</p>
        </section>

        <section className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button className="btn px-6 py-3 text-[15px]" onClick={openProfile}>
            {t('welcome.start')}
          </button>
          <p className="text-sm text-ink-faint">{t('welcome.later')}</p>
        </section>
      </main>
    </div>
  );
}
