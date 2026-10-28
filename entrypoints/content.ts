import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { pickAdapter } from '@/src/adapters';
import { fillPage, undoLastFill, type FillResult, type UndoResult } from '@/src/engine';
import { addBlocks, findAddButton, type BlockKind } from '@/src/engine/blocks';
import { fillField } from '@/src/engine/fill';
import { learnFrom, type Learned } from '@/src/engine/learn';
import { highlight } from '@/src/engine/report';
import { fieldOf, scan } from '@/src/engine/scan';
import { snapshot } from '@/src/engine/snapshot';
import { logUrl } from '@/src/core/applications';
import { loadKeepFilling } from '@/src/core/fill';
import { fillPlaceholders, readJob, type Job } from '@/src/engine/job';
import type { Message } from '@/src/core/messages';
import { loadProfile } from '@/src/profile/store';
import { translator, type Translate } from '@/src/ui/i18n';
import { loadLanguage } from '@/src/ui/language';
import { learnCard } from '@/src/ui/learn-card';
import { DEFAULT_PALETTE, loadPalette, PALETTES } from '@/src/ui/palette';

const HOST_ID = 'localapply-ui';
/** The floating "Fill application" button on known job sites. Off for now: fills start from the toolbar popup or the shortcut. */
const SHOW_PAGE_BUTTON = false;
const BUTTON_CHECK_MS = 1500;
const TOAST_MS = 6000;
/** Long enough to look the form over before deciding to undo. */
const TOAST_WITH_ACTION_MS = 12000;

let running = false;

function send(message: Message): void {
  browser.runtime.sendMessage(message).catch(() => {});
}

/** Shadow-rooted container so page styles and ours do not affect each other. */
function ui(): ShadowRoot {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; right: 16px; bottom: 16px;';
    host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      /* The host is reset with "all: initial", which beats :host rules, so the font is set here.
         Colours follow the palette chosen on the profile page (see paint()); the page's own fonts are not touched. */
      .stack { font: 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
      button { all: unset; cursor: pointer; background: var(--accent, #1f6b4f); color: #fff; padding: 9px 14px; border-radius: 8px;
        font-weight: 600; box-shadow: 0 6px 18px rgba(28,26,22,.22); }
      button:hover { background: var(--accent-hover, #175a41); }
      button:focus-visible { outline: 2px solid var(--light, #74c79f); outline-offset: 2px; }
      .toast { background: #1c1a16; color: #eee9df; padding: 11px 14px; border-radius: 8px; max-width: 320px;
        border-left: 3px solid var(--light, #74c79f); box-shadow: 0 6px 18px rgba(28,26,22,.28); }
      .toast button { background: none; box-shadow: none; padding: 0; border-radius: 0; margin-left: 10px;
        color: var(--lighter, #93d6b5); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
      .toast button:hover { background: none; color: #fff; }
      .learn { background: #1c1a16; color: #eee9df; padding: 12px 14px; border-radius: 8px; width: 320px; max-width: calc(100vw - 64px);
        border-left: 3px solid var(--light, #74c79f); box-shadow: 0 6px 18px rgba(28,26,22,.28); }
      .learn.open { width: 360px; }
      .learn p { margin: 0; }
      .learn .title { font-weight: 600; }
      .learn .note { color: #b3ac9f; font-size: 12px; margin-top: 4px; }
      .learn ul { list-style: none; margin: 10px 0 0; padding: 0; max-height: 45vh; overflow-y: auto; }
      .learn li { padding: 8px 0; border-top: 1px solid #2d2a25; }
      .learn .question { display: flex; gap: 8px; align-items: flex-start; cursor: pointer; font-weight: 600; }
      .learn input[type=checkbox] { margin: 2px 0 0; accent-color: var(--light, #74c79f); }
      .learn textarea { display: block; box-sizing: border-box; width: 100%; margin-top: 6px; padding: 6px 8px; resize: vertical;
        font: inherit; color: #eee9df; background: #2a2721; border: 1px solid #423e36; border-radius: 6px; }
      .learn textarea:focus { outline: 2px solid var(--light, #74c79f); outline-offset: 0; }
      .learn .actions { display: flex; gap: 14px; align-items: center; margin-top: 10px; }
      .learn button { padding: 6px 12px; box-shadow: none; font-weight: 600; }
      .learn button.quiet { background: none; padding: 0; border-radius: 0; color: var(--lighter, #93d6b5);
        text-decoration: underline; text-underline-offset: 3px; }
      .learn button.quiet:hover { background: none; color: #fff; }
    `;
    const stack = document.createElement('div');
    stack.className = 'stack';
    host.shadowRoot!.append(style, stack);
    document.documentElement.append(host);
  }
  return host.shadowRoot!;
}

/** Gives the notice the palette chosen on the profile page. Custom properties pass into the shadow root. */
async function paint(): Promise<void> {
  const colours = PALETTES[await loadPalette().catch(() => DEFAULT_PALETTE)];
  const host = ui().host as HTMLElement;
  host.style.setProperty('--accent', colours.accent);
  host.style.setProperty('--accent-hover', colours.hover);
  host.style.setProperty('--light', colours.light);
  host.style.setProperty('--lighter', colours.lighter);
}

/** Shows a notice, optionally with one action button (Undo). */
function toast(text: string, action?: { label: string; run: () => void }): void {
  const stack = ui().querySelector('.stack')!;
  stack.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.append(text);
  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      el.remove();
      action.run();
    });
    el.append(button);
  }
  stack.prepend(el);
  setTimeout(() => el.remove(), action ? TOAST_WITH_ACTION_MS : TOAST_MS);
}

/** The notices speak the interface language chosen on the profile page. */
async function texts(): Promise<Translate> {
  return translator(await loadLanguage().catch(() => 'en' as const));
}

function summary(result: FillResult, t: Translate): string {
  const parts = [t('notice.filled', { n: result.filled.length })];
  const open = result.unmatched.length + result.missing.length;
  if (open) parts.push(t('notice.open', { n: open }));
  if (result.skipped) parts.push(t('notice.skipped', { n: result.skipped }));
  return parts.join(' · ');
}

function undoSummary(result: UndoResult, t: Translate): string {
  const undid = t('notice.undid', { n: result.restored });
  return result.manual.length ? `${undid} · ${t('notice.manual', { n: result.manual.length })}` : undid;
}

async function undo(): Promise<void> {
  const result = undoLastFill(document);
  send({ type: 'undo-result', result });
  if (!result.restored && !result.manual.length) return;
  const [t] = await Promise.all([texts(), paint()]);
  toast(undoSummary(result, t));
}

/** The posting this page shows, with its address; only the top frame can tell. */
function thisJob(): Job {
  return { ...readJob(document), url: logUrl(location.href) };
}

/*
 * Learning answers. After a fill, what the applicant types into questions LocalApply couldn't answer is
 * kept here, in this frame's memory only, and offered for saving. Nothing is written unless they press Save,
 * and nothing is watched on a page that wasn't filled.
 */
let learning = false;
let fillJob: Job | undefined;
/** Answers on offer, by question. */
const learned = new Map<string, Learned>();
/**
 * Answers already offered, by question, as they stand in the form: whether saved, edited in the card or
 * turned down, they are not offered again unless the applicant changes them in the form.
 */
const offered = new Map<string, string>();
let card: HTMLElement | null = null;

function closeCard(): void {
  card?.remove();
  card = null;
}

async function showCard(): Promise<void> {
  const [t] = await Promise.all([texts(), paint()]);
  // An open list keeps what the applicant is editing; it is rebuilt the next time.
  if (card?.classList.contains('open')) return;
  closeCard();
  if (!learned.size) return;
  const items = [...learned.values()];
  const settle = () => {
    for (const item of items) {
      offered.set(item.label, item.answer);
      learned.delete(item.label);
    }
    closeCard();
  };
  card = learnCard(items, t, {
    dismiss: settle,
    save: (picked) => {
      settle();
      if (!picked.length) return;
      const message: Message = { type: 'save-answers', answers: picked };
      browser.runtime
        .sendMessage(message)
        .then(() => toast(t('learn.saved', { n: picked.length })))
        .catch(() => toast(t('options.saveError')));
    },
  });
  ui().querySelector('.stack')!.append(card);
}

/** The control an event really happened on, also inside shadow roots; null for LocalApply's own notice. */
function eventTarget(event: Event): HTMLElement | null {
  const target = event.composedPath()[0];
  if (!(target instanceof HTMLElement)) return null;
  const root = target.getRootNode();
  return root instanceof ShadowRoot && (root.host as HTMLElement).id === HOST_ID ? null : target;
}

async function noticeAnswer(event: Event): Promise<void> {
  const target = eventTarget(event);
  if (!target) return;
  const answer = learnFrom(target, await loadProfile(), {
    hints: pickAdapter(location, document)?.hints,
    job: fillJob,
  });
  if (!answer) {
    // Emptied again: no longer an answer to offer.
    const label = fieldOf(target)?.label;
    if (label && learned.delete(label)) void showCard();
    return;
  }
  if (offered.get(answer.label) === answer.answer || learned.get(answer.label)?.answer === answer.answer) return;
  learned.set(answer.label, answer);
  void showCard();
}

function startLearning(job: Job | undefined): void {
  fillJob = job;
  if (learning) return;
  learning = true;
  document.addEventListener('focusout', (event) => void noticeAnswer(event), true);
  // Dropdowns and radio buttons answer on change, sometimes without taking focus.
  document.addEventListener('change', (event) => void noticeAnswer(event), true);
}

/** "Save what's in this field as an answer" from the right-click menu: no fill needed first. */
async function saveMenuTarget(job: Job | undefined): Promise<void> {
  const [t] = await Promise.all([texts(), paint()]);
  const answer =
    menuTarget &&
    learnFrom(menuTarget, await loadProfile(), { hints: pickAdapter(location, document)?.hints, job: job ?? fillJob });
  if (!answer) return toast(t('notice.nothingToSave'));
  offered.set(answer.label, answer.answer);
  if (learned.delete(answer.label)) void showCard();
  const message: Message = { type: 'save-answers', answers: [answer] };
  browser.runtime
    .sendMessage(message)
    .then(() => toast(t('learn.saved', { n: 1 })))
    .catch(() => toast(t('options.saveError')));
}

/*
 * Steps of a multi-page application that swap the form without loading a page (Workday, SuccessFactors):
 * after a fill, form fields that appear later in this frame are filled too, while "keep filling" is on.
 * Steps that load a new page are filled by the background script.
 */
const STEP_SETTLE_MS = 800;
let watchingSteps = false;
let stepJob: Job | undefined;
const knownFields = new WeakSet<Element>();

/** Notes every field now on the page; returns those not seen before, leaving out open dropdown lists. */
function newFields(): Element[] {
  const fresh: Element[] = [];
  for (const { el } of scan(document)) {
    if (knownFields.has(el)) continue;
    knownFields.add(el);
    if (!el.closest('[role="listbox"], [role="menu"]')) fresh.push(el);
  }
  return fresh;
}

function watchSteps(job: Job | undefined): void {
  stepJob = job;
  newFields();
  if (watchingSteps) return;
  watchingSteps = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (running || !(await loadKeepFilling())) return;
      if (newFields().length) void run(false, stepJob, true);
    }, STEP_SETTLE_MS);
  }).observe(document.documentElement, { childList: true, subtree: true });
}

/** Presses the form's "add" button for jobs or schools as often as asked in the popup, then fills. */
async function addAndFill(kind: BlockKind, count: number, job: Job | undefined): Promise<void> {
  if (running || !findAddButton(document, kind)) return;
  await addBlocks(document, kind, count);
  await run(false, job);
}

/*
 * "Fill this field with" from the right-click menu. The menu says only which frame was clicked, so each
 * frame remembers the control its last right-click was on.
 */
let menuTarget: HTMLElement | null = null;

async function fillMenuTarget(value: string, job: Job | undefined): Promise<void> {
  const field = menuTarget && fieldOf(menuTarget);
  if (!field) return;
  const text = fillPlaceholders(value, job);
  // Asked for this text by name: put it in even when the page doesn't say the employer, and say what to finish.
  if (await fillField(field, [text ?? value])) highlight(field, 'filled');
  if (text === null) {
    const [t] = await Promise.all([texts(), paint()]);
    toast(t('notice.placeholdersLeft'));
  }
}

async function run(overwrite: boolean, given?: Job, auto = false): Promise<void> {
  if (running) return;
  // A fill started without the job (an older popup) can still read it here in the top frame.
  const job = given ?? (window === window.top ? thisJob() : undefined);
  running = true;
  send({ type: 'fill-start' });
  let result: FillResult = { adapter: null, total: 0, filled: [], missing: [], unmatched: [], skipped: 0 };
  try {
    const [profile, t] = await Promise.all([loadProfile(), texts(), paint()]);
    result = await fillPage(document, profile, { overwrite, location, job });
    if (result.total > 0) {
      startLearning(job);
      watchSteps(job);
    }
    if (auto) {
      // The next step of an application: say something only when something was filled.
      if (result.filled.length) {
        toast(t('notice.nextStep', { n: result.filled.length }), {
          label: t('notice.undo'),
          run: () => send({ type: 'relay-undo' }),
        });
      }
    } else if (result.total > 0 && (window === window.top || result.filled.length > 0)) {
      const action = result.filled.length
        ? { label: t('notice.undo'), run: () => send({ type: 'relay-undo' }) }
        : undefined;
      toast(summary(result, t), action);
    }
  } catch (error) {
    console.error('[LocalApply]', error);
  } finally {
    running = false;
    // What this fill changed is not a new step.
    if (watchingSteps) newFields();
    send({ type: 'fill-result', result, job, ...(auto ? { auto } : {}) });
  }
}

/** Shows a one-click button while a known application form is on screen. */
function watchForForm(): void {
  const update = () => {
    const adapter = pickAdapter(location, document);
    const show =
      Boolean(adapter) &&
      (adapter!.ready?.(document) ?? true) &&
      Boolean(document.querySelector('input, textarea, select'));
    const existing = document.getElementById(HOST_ID)?.shadowRoot?.querySelector('button.fill');
    if (show && !existing) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fill';
      button.textContent = 'Fill application';
      void texts().then((t) => (button.textContent = t('notice.fillButton')));
      void paint();
      button.addEventListener('click', () => send({ type: 'relay-fill' }));
      ui().querySelector('.stack')!.append(button);
    } else if (!show && existing) {
      existing.remove();
    }
  };
  update();
  setInterval(update, BUTTON_CHECK_MS);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',
  main() {
    browser.runtime.onMessage.addListener((message: Message) => {
      if (message?.type === 'fill') void run(Boolean(message.overwrite), message.job, Boolean(message.auto));
      if (message?.type === 'add-blocks') void addAndFill(message.kind, message.count, message.job);
      if (message?.type === 'save-field') void saveMenuTarget(message.job);
      if (message?.type === 'snapshot' && scan(document).length) {
        send({ type: 'snapshot-part', html: snapshot(document), url: logUrl(location.href) });
      }
      if (message?.type === 'undo' && !running) void undo();
      if (message?.type === 'fill-field') void fillMenuTarget(message.value, message.job);
      // Only the top frame is asked; its answer is the reply.
      if (message?.type === 'read-job') return Promise.resolve(thisJob());
    });
    // Only remembers where the menu opened; nothing on the page is read until an item is chosen.
    document.addEventListener('contextmenu', (event) => (menuTarget = eventTarget(event)), true);
    // The next page of an application being filled is filled too; the background knows whether this is one.
    if (window === window.top) send({ type: 'page-loaded', host: location.hostname });
    if (SHOW_PAGE_BUTTON) watchForForm();
  },
});
