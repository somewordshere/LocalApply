import { browser } from 'wxt/browser';
import type { Job } from '../engine/job';
import type { Message } from './messages';

/**
 * Asks the tab's top frame which posting it shows, then tells every frame to fill. The form is often in an
 * iframe that can't see the posting, so the job travels with the fill message. Resolves to the job.
 */
export async function fillTab(tabId: number, overwrite = false): Promise<Job | undefined> {
  const ask: Message = { type: 'read-job' };
  const job = (await browser.tabs.sendMessage(tabId, ask, { frameId: 0 }).catch(() => undefined)) as Job | undefined;
  const fill: Message = { type: 'fill', overwrite, job };
  // Rejects on pages without the content script (browser pages, the extension store).
  await browser.tabs.sendMessage(tabId, fill).catch(() => {});
  return job;
}
