import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import type { BlockKind } from '@/src/engine/blocks';
import type { Blocks, FieldOutcome, FillResult } from '@/src/engine/types';
import type { UndoResult } from '@/src/engine/undo';
import { earlierApplications, loadLog, type Application } from '@/src/core/applications';
import { fillTab, loadKeepFilling, readTabJob, saveKeepFilling } from '@/src/core/fill';
import type { Job } from '@/src/engine/job';
import type { Message } from '@/src/core/messages';
import { questionKeywords } from '@/src/profile/schema';
import { loadIndex, loadProfile, saveProfile, switchProfile, type ProfileIndex } from '@/src/profile/store';
import { useI18n } from '@/src/ui/I18nProvider';
import type { MessageKey } from '@/src/ui/i18n';
import { currentPalette, iconPath } from '@/src/ui/palette';

type Status = 'idle' | 'filling' | 'done' | 'undone' | 'unavailable';

const EMPTY: FillResult = { adapter: null, total: 0, filled: [], missing: [], unmatched: [], skipped: 0 };
const NOTHING_UNDONE: UndoResult = { restored: 0, manual: [] };
const NO_REPLY_MS = 1500;

/** How long frames get to send their form copies. */
const SNAPSHOT_WAIT_MS = 1200;

function mergeBlocks(a: Blocks | undefined, b: Blocks | undefined): Blocks | undefined {
  if (!a || !b) return a ?? b;
  return {
    experience: Math.max(a.experience, b.experience),
    education: Math.max(a.education, b.education),
    addExperience: a.addExperience || b.addExperience,
    addEducation: a.addEducation || b.addEducation,
  };
}

function merge(a: FillResult, b: FillResult): FillResult {
  return {
    adapter: a.adapter ?? b.adapter,
    total: a.total + b.total,
    filled: [...a.filled, ...b.filled],
    missing: [...a.missing, ...b.missing],
    unmatched: [...a.unmatched, ...b.unmatched],
    skipped: a.skipped + b.skipped,
    fields: [...(a.fields ?? []), ...(b.fields ?? [])],
    blocks: mergeBlocks(a.blocks, b.blocks),
  };
}

const OUTCOME: Record<FieldOutcome, MessageKey> = {
  filled: 'details.filled',
  missing: 'details.missing',
  unmatched: 'details.unmatched',
  skipped: 'details.skipped',
};

/** "Why wasn't this filled?": every field the fill met, what it was taken for, and what happened to it. */
function Details({
  result,
  onSnapshot,
  snapshotNote,
}: {
  result: FillResult;
  onSnapshot: () => void;
  snapshotNote: string;
}) {
  const { t } = useI18n();
  if (!result.fields?.length) return null;
  return (
    <details>
      <summary className="cursor-pointer font-semibold text-ink-soft select-none hover:text-ink">
        {t('details.title')}
      </summary>
      <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto text-xs">
        {result.fields.map((f, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
            <span className="min-w-0 break-words text-ink">{f.label || t('details.noLabel')}</span>
            <span className={`shrink-0 text-right ${f.outcome === 'filled' ? 'text-accent' : 'text-ink-faint'}`}>
              {t(OUTCOME[f.outcome])}
              {f.key && f.key !== 'custom answer' && <span className="block font-mono text-[10px]">{f.key}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">{t('details.snapshotHint')}</p>
      <button className="btn-quiet mt-2 py-1 text-xs" onClick={onSnapshot}>
        {t('details.snapshot')}
      </button>
      {snapshotNote && <p className="mt-1.5 text-xs text-ink-soft">{snapshotNote}</p>}
    </details>
  );
}

/** Offers to press the form's "add" button when the profile has more jobs or schools than the form has blocks. */
function AddBlocks({
  blocks,
  lists,
  onAdd,
}: {
  blocks: Blocks | undefined;
  lists: Record<BlockKind, number>;
  onAdd: (kind: BlockKind, count: number) => void;
}) {
  const { t } = useI18n();
  if (!blocks) return null;
  const offers = (['experience', 'education'] as const).flatMap((kind) => {
    const canAdd = kind === 'experience' ? blocks.addExperience : blocks.addEducation;
    const missing = lists[kind] - blocks[kind];
    return canAdd && missing > 0 ? [{ kind, missing }] : [];
  });
  if (!offers.length) return null;
  return (
    <div className="space-y-2">
      {offers.map(({ kind, missing }) => (
        <div key={kind} className="rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
          <p className="text-ink">
            {t(kind === 'experience' ? 'blocks.experience' : 'blocks.education', {
              have: blocks[kind],
              total: lists[kind],
            })}
          </p>
          <button className="btn mt-2 py-1.5 text-xs" onClick={() => onAdd(kind, missing)}>
            {t('blocks.add', { n: missing })}
          </button>
        </div>
      ))}
    </div>
  );
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
            {a.status && a.status !== 'applied' && ` · ${t(`status.${a.status}`)}`}
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
  const [keepFilling, setKeepFilling] = useState(true);
  const [lists, setLists] = useState<Record<BlockKind, number>>({ experience: 0, education: 0 });
  const [snapshotNote, setSnapshotNote] = useState('');
  const snapshotParts = useRef<{ html: string; url: string }[] | null>(null);
  const pending = useRef(0);
  const replied = useRef(false);

  useEffect(() => {
    loadProfile().then((p) => {
      setProfileEmpty(!p.firstName && !p.lastName && !p.email);
      setLists({ experience: p.experience.length, education: p.education.length });
    });
    void loadIndex().then(setProfiles);
    void loadKeepFilling().then(setKeepFilling);
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
        // Later steps filled on their own belong to the page, not to this popup's fill.
        if (message.auto) return;
        pending.current = Math.max(0, pending.current - 1);
        setResult((current) => merge(current, message.result));
        if (pending.current === 0) setStatus('done');
      } else if (message?.type === 'snapshot-part') {
        snapshotParts.current?.push({ html: message.html, url: message.url });
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

  /** Presses the form's add button `count` times in whichever frame has it, then fills again. */
  const addMore = async (kind: BlockKind, count: number) => {
    setResult(EMPTY);
    setStatus('filling');
    pending.current = 0;
    replied.current = false;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return setStatus('unavailable');
    const message: Message = { type: 'add-blocks', kind, count, job: await readTabJob(tab.id) };
    browser.tabs.sendMessage(tab.id, message).catch(() => {});
    setTimeout(
      () => {
        if (!replied.current) setStatus('unavailable');
      },
      NO_REPLY_MS + count * 600,
    );
  };

  /** Collects a copy of the form from every frame that has one and saves them as one HTML file. */
  const saveSnapshot = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) return;
    snapshotParts.current = [];
    const message: Message = { type: 'snapshot' };
    browser.tabs.sendMessage(tab.id, message).catch(() => {});
    setTimeout(() => {
      const parts = snapshotParts.current ?? [];
      snapshotParts.current = null;
      if (!parts.length) return setSnapshotNote(t('details.snapshotNone'));
      const html = parts.map((part) => `<!-- LocalApply form copy of ${part.url} -->\n${part.html}`).join('\n');
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'localapply-form.html';
      link.click();
      URL.revokeObjectURL(url);
      setSnapshotNote(t('details.snapshotSaved'));
    }, SNAPSHOT_WAIT_MS);
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

      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={keepFilling}
          onChange={(e) => {
            setKeepFilling(e.target.checked);
            void saveKeepFilling(e.target.checked);
          }}
        />
        {t('popup.keepFilling')}
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

            <AddBlocks blocks={result.blocks} lists={lists} onAdd={(kind, count) => void addMore(kind, count)} />

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

            <Details result={result} onSnapshot={() => void saveSnapshot()} snapshotNote={snapshotNote} />
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
