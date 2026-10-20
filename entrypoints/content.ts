import { defineContentScript } from 'wxt/utils/define-content-script';
import { browser } from 'wxt/browser';
import { pickAdapter } from '@/src/adapters';
import { fillPage, undoLastFill, type FillResult, type UndoResult } from '@/src/engine';
import type { Message } from '@/src/core/messages';
import { loadProfile } from '@/src/profile/store';
import { translator, type Translate } from '@/src/ui/i18n';
import { loadLanguage } from '@/src/ui/language';

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
         Colours follow the extension's paper-and-ink palette; the page's own fonts are not touched. */
      .stack { font: 13px/1.45 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
      button { all: unset; cursor: pointer; background: #1f6b4f; color: #fff; padding: 9px 14px; border-radius: 8px;
        font-weight: 600; box-shadow: 0 6px 18px rgba(28,26,22,.22); }
      button:hover { background: #175a41; }
      button:focus-visible { outline: 2px solid #74c79f; outline-offset: 2px; }
      .toast { background: #1c1a16; color: #eee9df; padding: 11px 14px; border-radius: 8px; max-width: 320px;
        border-left: 3px solid #74c79f; box-shadow: 0 6px 18px rgba(28,26,22,.28); }
      .toast button { background: none; box-shadow: none; padding: 0; border-radius: 0; margin-left: 10px;
        color: #93d6b5; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
      .toast button:hover { background: none; color: #b8e6cd; }
    `;
    const stack = document.createElement('div');
    stack.className = 'stack';
    host.shadowRoot!.append(style, stack);
    document.documentElement.append(host);
  }
  return host.shadowRoot!;
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
  if (result.restored || result.manual.length) toast(undoSummary(result, await texts()));
}

async function run(overwrite: boolean): Promise<void> {
  if (running) return;
  running = true;
  send({ type: 'fill-start' });
  let result: FillResult = { adapter: null, total: 0, filled: [], missing: [], unmatched: [], skipped: 0 };
  try {
    const [profile, t] = await Promise.all([loadProfile(), texts()]);
    result = await fillPage(document, profile, { overwrite, location });
    if (result.total > 0 && (window === window.top || result.filled.length > 0)) {
      const action = result.filled.length
        ? { label: t('notice.undo'), run: () => send({ type: 'relay-undo' }) }
        : undefined;
      toast(summary(result, t), action);
    }
  } catch (error) {
    console.error('[LocalApply]', error);
  } finally {
    running = false;
    send({ type: 'fill-result', result });
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
      if (message?.type === 'fill') void run(Boolean(message.overwrite));
      if (message?.type === 'undo' && !running) void undo();
    });
    if (SHOW_PAGE_BUTTON) watchForForm();
  },
});
