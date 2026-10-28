import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { logUrl, recordApplication } from '@/src/core/applications';
import { fillTab, readTabJob } from '@/src/core/fill';
import { isEditItem, menuValue, refreshMenu, watchMenu } from '@/src/core/menu';
import { saveLearned, type Learned } from '@/src/engine/learn';
import { activeProfileName, loadIndex, loadProfile, loadProfileById, saveProfile } from '@/src/profile/store';
import type { Job } from '@/src/engine/job';
import type { Message } from '@/src/core/messages';
import { iconPath, loadPalette, watchPalette, type Palette } from '@/src/ui/palette';

/** How long to wait for the other frames of a tab to report before logging a fill. */
const LOG_AFTER_MS = 1500;

export default defineBackground(() => {
  const sendToTab = (tabId: number, message: Message) => {
    // Rejects on pages without the content script (browser pages, the extension store).
    browser.tabs.sendMessage(tabId, message).catch(() => {});
  };

  // The toolbar button wears the chosen palette's accent. The browser keeps it until it restarts.
  const action = browser.action ?? browser.browserAction;
  const showIcon = (palette: Palette) => {
    const path = Object.fromEntries(([16, 32, 48] as const).map((size) => [size, iconPath(palette, size)]));
    void action.setIcon({ path }).catch(() => {});
  };
  const showSavedIcon = () => void loadPalette().then(showIcon, () => {});
  showSavedIcon();
  browser.runtime.onStartup.addListener(showSavedIcon);
  watchPalette(showIcon);

  // A fresh install starts on the welcome page, which explains LocalApply and leads to the profile.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  });

  // "Fill this field with": built from the active profile, rebuilt when it changes.
  refreshMenu(0);
  watchMenu();
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const id = String(info.menuItemId);
    if (isEditItem(id)) return void browser.runtime.openOptionsPage();
    if (tab?.id === undefined) return;
    const value = menuValue(id, await loadProfile());
    if (value === null) return;
    const job = await readTabJob(tab.id);
    const message: Message = { type: 'fill-field', value, job };
    browser.tabs.sendMessage(tab.id, message, { frameId: info.frameId ?? 0 }).catch(() => {});
  });

  /** Answers typed into a form, saved into the active profile. */
  const saveAnswers = async (answers: Learned[]) => {
    const { active } = await loadIndex();
    await saveProfile(saveLearned(await loadProfileById(active), answers), active);
  };

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'fill-form') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) void fillTab(tab.id);
  });

  // Each frame of a tab reports its own result; once they have all come in, a fill that filled something is logged.
  const fills = new Map<number, { filled: number; job: Job; timer: ReturnType<typeof setTimeout> }>();
  const noteFill = (tabId: number, tabUrl: string | undefined, filled: number, job: Job = {}) => {
    const entry = fills.get(tabId);
    if (entry) clearTimeout(entry.timer);
    const merged = {
      filled: (entry?.filled ?? 0) + filled,
      job: {
        company: entry?.job.company || job.company,
        position: entry?.job.position || job.position,
        url: entry?.job.url || job.url,
      },
    };
    fills.set(tabId, {
      ...merged,
      timer: setTimeout(() => {
        fills.delete(tabId);
        const url = merged.job.url || logUrl(tabUrl ?? '');
        if (merged.filled > 0 && url) {
          void activeProfileName().then((profile) =>
            recordApplication({ company: merged.job.company ?? '', position: merged.job.position ?? '', url, profile }),
          );
        }
      }, LOG_AFTER_MS),
    });
  };

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (sender.tab?.id === undefined) return;
    if (message?.type === 'fill-result')
      noteFill(sender.tab.id, sender.tab.url, message.result.filled.length, message.job);
    if (message?.type === 'relay-fill') void fillTab(sender.tab.id);
    if (message?.type === 'relay-undo') sendToTab(sender.tab.id, { type: 'undo' });
    // The reply tells the page the answers are saved.
    if (message?.type === 'save-answers') return saveAnswers(message.answers).then(() => true);
  });
});
