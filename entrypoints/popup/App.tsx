import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import type { FillResult } from '@/src/engine/types';
import type { UndoResult } from '@/src/engine/undo';
import { earlierApplications, loadLog, type Application } from '@/src/core/applications';
import { fillTab, readTabJob } from '@/src/core/fill';
import type { Job } from '@/src/engine/job';
import type { Message } from '@/src/core/messages';
import { questionKeywords } from '@/src/profile/schema';
import { loadIndex, loadProfile, saveProfile, switchProfile, type ProfileIndex } from '@/src/profile/store';
import { useI18n } from '@/src/ui/I18nProvider';
import { currentPalette, iconPath } from '@/src/ui/palette';

type Status = 'idle' | 'filling' | 'done' | 'undone' | 'unavailable';

const EMPTY: FillResult = { adapter: null, total: 0, filled: [], missing: [], unmatched: [], skipped: 0 };
const NOTHING_UNDONE: UndoResult = { restored: 0, manual: [] };
const NO_REPLY_MS = 1500;

function merge(a: FillResult, b: FillResult): FillResult {
  return {
    adapter: a.adapter ?? b.adapter,
    total: a.total + b.total,
    filled: [...a.filled, ...b.filled],
    missing: [...a.missing, ...b.missing],
    unmatched: [...a.unmatched, ...b.unmatched],
    skipped: a.skipped + b.skipped,
  };
}

function SaveAnswer({ label }: { label: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!answer.trim()) return;
    const profile = await loadProfile();
    profile.customAnswers.push({ id: crypto.randomUUID(), keywords: questionKeywords(label), answer: answer.trim() });
    await saveProfile(profile);
    setSaved(true);
    setOpen(false);
  };

  return (
    <li className="py-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-ink">{label}</span>
        {saved ? (
          <span className="shrink-0 text-xs font-medium text-accent">{t('popup.answerSaved')}</span>
        ) : (
          <button className="link shrink-0 text-xs" onClick={() => setOpen(!open)}>
            {open ? t('cancel') : t('popup.saveAnswer')}
          </button>
        )}
      </div>
      {open && (
        <div className="mt-1.5 flex gap-2">
          <input
            className="field"
            autoFocus
            aria-label={t('popup.answerFor', { label })}
            placeholder={t('popup.yourAnswer')}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <button className="btn-quiet" onClick={save}>
            {t('save')}
          </button>
        </div>
      )}
    </li>
  );
}

/** Says when the log shows an earlier application to this employer, so nobody applies twice by accident. */
function AppliedBefore({ earlier, job }: { earlier: Application[]; job: Job }) {
  const { lang, t } = useI18n();
  const company = job.company || earlier[0].company;
  const date = (iso: string) => new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso));
  const SHOWN = 3;
  return (
    <div className="mb-3 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-sm">
      <p className="font-semibold text-warn">
        {company ? t('popup.appliedBefore', { company }) : t('popup.filledBefore')}
      </p>
      <ul className="mt-1 space-y-0.5 text-ink-soft">
        {earlier.slice(0, SHOWN).map((a) => (
          <li key={a.id}>
            {date(a.date)}
            {a.position && ` · ${a.position}`}
          </li>
        ))}
      </ul>
      {earlier.length > SHOWN && (
        <p className="text-xs text-ink-faint">{t('popup.appliedMore', { n: earlier.length - SHOWN })}</p>
      )}
      <button
        className="link mt-1 text-xs"
        onClick={() => void browser.tabs.create({ url: browser.runtime.getURL('/options.html#applications') })}
      >
        {t('popup.seeLog')}
      </button>
    </div>
  );
}

/** Explains the outlines on the page by line style as well as colour. */
function Legend() {
  const { t } = useI18n();
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm border-2 border-solid border-[#16a34a]" />
        {t('popup.legendFilled')}
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm border-2 border-dashed border-[#d97706]" />
        {t('popup.legendAttention')}
      </span>
    </p>
  );
}

export default function App() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>('idle');
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState<FillResult>(EMPTY);
  const [undone, setUndone] = useState<UndoResult>(NOTHING_UNDONE);
  const [profileEmpty, setProfileEmpty] = useState(false);
  const [profiles, setProfiles] = useState<ProfileIndex | null>(null);
  const [earlier, setEarlier] = useState<{ job: Job; list: Application[] } | null>(null);
  const pending = useRef(0);
  const replied = useRef(false);

  useEffect(() => {
    loadProfile().then((p) => setProfileEmpty(!p.firstName && !p.lastName && !p.email));
    void loadIndex().then(setProfiles);
    void (async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const job = tab?.id === undefined ? undefined : await readTabJob(tab.id);
      if (!job) return;
      const list = earlierApplications(await loadLog(), job);
      if (list.length) setEarlier({ job, list });
    })();

    const onMessage = (message: Message) => {
      if (message?.type === 'fill-start') {
        replied.current = true;
        pending.current++;
      } else if (message?.type === 'fill-result') {
        pending.current = Math.max(0, pending.current - 1);
        setResult((current) => merge(current, message.result));
        if (pending.current === 0) setStatus('done');
      } else if (message?.type === 'undo-result') {
        setUndone((current) => ({
          restored: current.restored + message.result.restored,
          manual: [...current.manual, ...message.result.manual],
        }));
      }
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, []);

  const fill = async () => {
    setResult(EMPTY);
    setStatus('filling');
    pending.current = 0;
    replied.current = false;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return setStatus('unavailable');
    await fillTab(tab.id, overwrite);
    setTimeout(() => {
      if (!replied.current) setStatus('unavailable');
    }, NO_REPLY_MS);
  };

  const undo = async () => {
    setUndone(NOTHING_UNDONE);
    setStatus('undone');
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    const message: Message = { type: 'undo' };
    browser.tabs.sendMessage(tab.id, message).catch(() => {});
  };

  const open = [...new Map(result.unmatched.map((u) => [u.label, u])).values()].slice(0, 25);
  const missing = [...new Map(result.missing.map((m) => [m.label, m])).values()];

  return (
    <main className="w-[360px] bg-paper p-4 text-ink">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <img src={iconPath(currentPalette(), 48)} alt="" className="size-6 rounded-md" />
          LocalApply
        </h1>
        <button className="btn-quiet py-1 text-xs" onClick={() => browser.runtime.openOptionsPage()}>
          {t('popup.editProfile')}
        </button>
      </header>

      {profileEmpty && (
        <p className="mb-3 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          {t('popup.profileEmpty')}
        </p>
      )}

      {earlier && <AppliedBefore earlier={earlier.list} job={earlier.job} />}

      {profiles && profiles.list.length > 1 && (
        <label className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
          <span aria-hidden="true">{t('profiles.label')}</span>
          <select
            className="field py-1.5"
            aria-label={t('profiles.label')}
            value={profiles.active}
            onChange={(e) => {
              const active = e.target.value;
              setProfiles({ ...profiles, active });
              void switchProfile(active).then(() =>
                loadProfile().then((p) => setProfileEmpty(!p.firstName && !p.lastName && !p.email)),
              );
            }}
          >
            {profiles.list.map((ref) => (
              <option key={ref.id} value={ref.id}>
                {ref.name || t('profiles.main')}
              </option>
            ))}
          </select>
        </label>
      )}

      <button className="btn w-full py-3 text-[15px]" onClick={fill} disabled={status === 'filling'}>
        {status === 'filling' ? t('popup.filling') : t('popup.fill')}
      </button>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
        />
        {t('popup.overwrite')}
      </label>

      <p className="mt-1.5 text-xs text-ink-faint">{t('popup.nothingSubmitted')}</p>

      <div aria-live="polite">
        {status === 'unavailable' && <p className="mt-4 text-sm text-ink-soft">{t('popup.unavailable')}</p>}

        {status === 'done' && (
          <section className="mt-4 space-y-4 border-t border-line pt-4 text-sm">
            {result.total === 0 ? (
              <p>{t('popup.noFields')}</p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p>
                  <span
                    className={`font-display text-xl font-semibold ${result.filled.length ? 'text-accent' : 'text-ink'}`}
                  >
                    {t('popup.filled', { n: result.filled.length })}
                  </span>
                  {result.skipped > 0 && <>, {t('popup.skipped', { n: result.skipped })}</>}
                  {result.adapter && <span className="text-ink-faint"> · {result.adapter}</span>}
                </p>
                {result.filled.length > 0 && (
                  <button className="btn-quiet shrink-0 py-1" onClick={undo}>
                    {t('popup.undoFill')}
                  </button>
                )}
              </div>
            )}

            {result.filled.length + result.missing.length + result.unmatched.length > 0 && <Legend />}

            {missing.length > 0 && (
              <div>
                <h2 className="font-semibold">{t('popup.missing')}</h2>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-ink-soft marker:text-ink-faint">
                  {missing.map((m) => (
                    <li key={m.label}>{m.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {open.length > 0 && (
              <div>
                <h2 className="font-semibold">{t('popup.open')}</h2>
                <p className="mt-0.5 text-xs text-ink-faint">{t('popup.openHint')}</p>
                <ul className="mt-1 max-h-56 divide-y divide-line overflow-y-auto">
                  {open.map((u) => (
                    <SaveAnswer key={u.label} label={u.label} />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {status === 'undone' && (
          <section className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
            <p>
              <span className="font-semibold">{t('popup.undone')}</span> {t('popup.restored', { n: undone.restored })}
            </p>
            {undone.manual.length > 0 && (
              <div>
                <h2 className="font-semibold">{t('popup.changeBack')}</h2>
                <p className="mt-0.5 text-xs text-ink-faint">{t('popup.changeBackHint')}</p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-ink-soft marker:text-ink-faint">
                  {[...new Set(undone.manual.map((m) => m.label))].map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
