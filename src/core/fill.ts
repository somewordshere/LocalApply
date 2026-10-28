import { browser } from 'wxt/browser';
import type { Job } from '../engine/job';
import type { Message } from './messages';

/** The posting the tab shows, as its top frame reads it; undefined where no content script runs. */
export async function readTabJob(tabId: number): Promise<Job | undefined> {
  const ask: Message = { type: 'read-job' };
  return (await browser.tabs.sendMessage(tabId, ask, { frameId: 0 }).catch(() => undefined)) as Job | undefined;
}

/**
 * Asks the tab's top frame which posting it shows, then tells every frame to fill. The form is often in an
 * iframe that can't see the posting, so the job travels with the fill message. Resolves to the job.
 * `auto`: the next step of an application the applicant started filling, filled without being asked again.
 */
export async function fillTab(tabId: number, overwrite = false, auto = false): Promise<Job | undefined> {
  const job = await readTabJob(tabId);
  const fill: Message = { type: 'fill', overwrite, job, ...(auto ? { auto } : {}) };
  // Rejects on pages without the content script (browser pages, the extension store).
  await browser.tabs.sendMessage(tabId, fill).catch(() => {});
  return job;
}

const KEEP_FILLING_KEY = 'keepFilling';

/**
 * Whether a fill carries on through the following steps of the same application (multi-page forms such as
 * Workday's), on the same site, until the tab leaves it. On unless the applicant turned it off.
 */
export async function loadKeepFilling(): Promise<boolean> {
  const stored = await browser.storage.local.get(KEEP_FILLING_KEY);
  return stored[KEEP_FILLING_KEY] !== false;
}

export async function saveKeepFilling(on: boolean): Promise<void> {
  await browser.storage.local.set({ [KEEP_FILLING_KEY]: on });
}

/** The site each tab is filling an application on, while it keeps filling; kept for the browser session only. */
const stepKey = (tabId: number) => `filling:${tabId}`;
/** Session storage, where the browser has it; without it, fills just don't carry on to the next page. */
const session = () => browser.storage.session as typeof browser.storage.session | undefined;

export async function startSteps(tabId: number, host: string): Promise<void> {
  await session()?.set({ [stepKey(tabId)]: host });
}

export async function stopSteps(tabId: number): Promise<void> {
  await session()?.remove(stepKey(tabId));
}

export async function stepsHost(tabId: number): Promise<string | undefined> {
  const stored = (await session()?.get(stepKey(tabId))) ?? {};
  const host = stored[stepKey(tabId)];
  return typeof host === 'string' ? host : undefined;
}
