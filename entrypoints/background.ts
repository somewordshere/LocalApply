import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { fillTab } from '@/src/core/fill';
import type { Message } from '@/src/core/messages';
import { iconPath, loadPalette, watchPalette, type Palette } from '@/src/ui/palette';

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

  // A fresh install starts on the profile page: nothing can be filled until it has details.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void browser.runtime.openOptionsPage();
  });

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'fill-form') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) void fillTab(tab.id);
  });

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (sender.tab?.id === undefined) return;
    if (message?.type === 'relay-fill') void fillTab(sender.tab.id);
    if (message?.type === 'relay-undo') sendToTab(sender.tab.id, { type: 'undo' });
  });
});
