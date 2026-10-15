import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';
import type { FillResult } from '@/src/engine/types';
import type { UndoResult } from '@/src/engine/undo';
import type { Message } from '@/src/core/messages';
import { questionKeywords } from '@/src/profile/schema';
import { loadProfile, saveProfile } from '@/src/profile/store';

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
        <span className="min-w-0 break-words">{label}</span>
        {saved ? (
          <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
        ) : (
          <button
            className="shrink-0 cursor-pointer text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Cancel' : 'Save answer'}
          </button>
        )}
      </div>
      {open && (
        <div className="mt-1.5 flex gap-2">
          <input
            className="field"
            autoFocus
            aria-label={`Answer for ${label}`}
            placeholder="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <button className="btn-quiet" onClick={save}>
            Save
          </button>
        </div>
      )}
    </li>
  );
}

/** Explains the outlines on the page by line style as well as colour. */
function Legend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm border-2 border-solid border-[#16a34a]" />
        Solid outline: filled
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-3 w-5 rounded-sm border-2 border-dashed border-[#d97706]" />
        Dashed outline: needs you
      </span>
    </p>
  );
}

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [overwrite, setOverwrite] = useState(false);
  const [result, setResult] = useState<FillResult>(EMPTY);
  const [undone, setUndone] = useState<UndoResult>(NOTHING_UNDONE);
  const [profileEmpty, setProfileEmpty] = useState(false);
  const pending = useRef(0);
  const replied = useRef(false);

  useEffect(() => {
    loadProfile().then((p) => setProfileEmpty(!p.firstName && !p.lastName && !p.email));

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
    const message: Message = { type: 'fill', overwrite };
    browser.tabs.sendMessage(tab.id, message).catch(() => {});
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
    <main className="w-[360px] p-4">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">LocalApply</h1>
        <button className="btn-quiet" onClick={() => browser.runtime.openOptionsPage()}>
          Edit profile
        </button>
      </header>

      {profileEmpty && (
        <p className="mb-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Your profile is empty. Add your details first.
        </p>
      )}

      <button className="btn w-full py-2.5" onClick={fill} disabled={status === 'filling'}>
        {status === 'filling' ? 'Filling…' : 'Fill this page'}
      </button>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          className="size-4 accent-indigo-600"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
        />
        Overwrite fields that already have a value
      </label>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Nothing is submitted. Review the form and send it yourself.
      </p>

      <div aria-live="polite">
        {status === 'unavailable' && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            This page can't be filled. If you just installed the extension, reload the tab and try again.
          </p>
        )}

        {status === 'done' && (
          <section className="mt-4 space-y-3 text-sm">
            {result.total === 0 ? (
              <p>No form fields found on this page.</p>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {result.filled.length} filled
                  </span>
                  {result.skipped > 0 && <>, {result.skipped} already had a value</>}
                  {result.adapter && <span className="text-slate-500 dark:text-slate-400"> · {result.adapter}</span>}
                </p>
                {result.filled.length > 0 && (
                  <button className="btn-quiet shrink-0 py-1" onClick={undo}>
                    Undo fill
                  </button>
                )}
              </div>
            )}

            {result.filled.length + result.missing.length + result.unmatched.length > 0 && <Legend />}

            {missing.length > 0 && (
              <div>
                <h2 className="font-medium">Not in your profile yet</h2>
                <ul className="mt-1 list-inside list-disc text-slate-600 dark:text-slate-300">
                  {missing.map((m) => (
                    <li key={m.label}>{m.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {open.length > 0 && (
              <div>
                <h2 className="font-medium">Left for you</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Save an answer and it is used the next time this question appears.
                </p>
                <ul className="mt-1 max-h-56 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
                  {open.map((u) => (
                    <SaveAnswer key={u.label} label={u.label} />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {status === 'undone' && (
          <section className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Fill undone.</span> {undone.restored} field
              {undone.restored === 1 ? '' : 's'} put back.
            </p>
            {undone.manual.length > 0 && (
              <div>
                <h2 className="font-medium">Change these back by hand</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Custom dropdowns keep their choice; they are outlined with a dashed line.
                </p>
                <ul className="mt-1 list-inside list-disc text-slate-600 dark:text-slate-300">
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
