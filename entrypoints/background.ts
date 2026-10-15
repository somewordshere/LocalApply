import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import type { Message } from '@/src/core/messages';

export default defineBackground(() => {
  const sendToTab = (tabId: number, message: Message) => {
    // Rejects on pages without the content script (browser pages, the extension store).
    browser.tabs.sendMessage(tabId, message).catch(() => {});
  };
  const fillTab = (tabId: number) => sendToTab(tabId, { type: 'fill' });

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'fill-form') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id !== undefined) fillTab(tab.id);
  });

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    if (sender.tab?.id === undefined) return;
    if (message?.type === 'relay-fill') fillTab(sender.tab.id);
    if (message?.type === 'relay-undo') sendToTab(sender.tab.id, { type: 'undo' });
  });
});
