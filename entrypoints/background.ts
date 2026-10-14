import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import type { Message } from '@/src/core/messages';

export default defineBackground(() => {
  const fillTab = (tabId: number) => {
    const message: Message = { type: 'fill' };
    // Rejects on pages without the content script (browser pages, the extension store).
    browser.tabs.sendMessage(tabId, message).catch(() => {});
  };

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'fill-form') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) fillTab(tab.id);
  });

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (message?.type === 'relay-fill' && sender.tab?.id !== undefined) fillTab(sender.tab.id);
  });
});
