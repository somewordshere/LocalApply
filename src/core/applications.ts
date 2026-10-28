import { browser } from 'wxt/browser';
import { companyKey, type Job } from '../engine/job';

/** One application form LocalApply filled. Kept in this browser only, like the profile. */
export interface Application {
  id: string;
  /** When it was (last) filled, ISO 8601. */
  date: string;
  company: string;
  position: string;
  /** The posting's address without query or fragment, which can carry tokens. */
  url: string;
  /** The profile that filled it; '' for the first profile. Missing in entries from before 0.8.0. */
  profile?: string;
}

const LOG_KEY = 'applicationLog';
const SETTING_KEY = 'logApplications';
/** Filling the same page again within this time updates its entry instead of adding one. */
const SAME_APPLICATION_MS = 24 * 60 * 60 * 1000;

function isApplication(value: unknown): value is Application {
  const a = value as Application;
  return (
    Boolean(a) &&
    ['id', 'date', 'company', 'position', 'url'].every((k) => typeof a[k as keyof Application] === 'string')
  );
}

export async function loadLog(): Promise<Application[]> {
  const stored = await browser.storage.local.get(LOG_KEY);
  const list = stored[LOG_KEY];
  return Array.isArray(list) ? list.filter(isApplication) : [];
}

async function saveLog(log: Application[]): Promise<void> {
  await browser.storage.local.set({ [LOG_KEY]: log });
}

/** On unless the person turned it off. */
export async function loadLogSetting(): Promise<boolean> {
  const stored = await browser.storage.local.get(SETTING_KEY);
  return stored[SETTING_KEY] !== false;
}

export async function saveLogSetting(on: boolean): Promise<void> {
  await browser.storage.local.set({ [SETTING_KEY]: on });
}

/** Calls back when the log or its setting changes on any page. Returns a stop function. */
export function watchLog(onChange: () => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    if (area === 'local' && (changes[LOG_KEY] || changes[SETTING_KEY])) onChange();
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

/** Notes a filled application, newest first; the same page within a day refreshes its entry. Off means nothing is kept. */
export async function recordApplication(entry: Omit<Application, 'id' | 'date'>, now = new Date()): Promise<void> {
  if (!(await loadLogSetting())) return;
  const log = await loadLog();
  const recent = log.find((a) => a.url === entry.url && now.getTime() - Date.parse(a.date) < SAME_APPLICATION_MS);
  const updated: Application = {
    id: recent?.id ?? crypto.randomUUID(),
    date: now.toISOString(),
    company: entry.company || recent?.company || '',
    position: entry.position || recent?.position || '',
    url: entry.url,
    profile: entry.profile ?? recent?.profile ?? '',
  };
  await saveLog([updated, ...log.filter((a) => a !== recent)]);
}

/**
 * Earlier applications to the posting's employer, newest first: the same company under any posting, and
 * this posting on an earlier day. Filling this page again the same day is still the same application.
 */
export function earlierApplications(log: Application[], job: Job, now = new Date()): Application[] {
  const company = companyKey(job.company ?? '');
  return log.filter((a) => {
    if (job.url && a.url === job.url) return now.getTime() - Date.parse(a.date) >= SAME_APPLICATION_MS;
    return Boolean(company) && companyKey(a.company) === company;
  });
}

export async function removeApplication(id: string): Promise<void> {
  await saveLog((await loadLog()).filter((a) => a.id !== id));
}

export async function clearLog(): Promise<void> {
  await saveLog([]);
}

/** The address as kept in the log: origin and path, nothing that could identify a session. */
export function logUrl(href: string): string {
  try {
    const url = new URL(href);
    return url.origin + url.pathname;
  } catch {
    return '';
  }
}

/** The log as CSV, for spreadsheets: one header row, every field quoted. */
export function logToCsv(log: Application[]): string {
  // Text from web pages must not run as a spreadsheet formula ("=HYPERLINK(…)"): such cells start with '.
  const FORMULA = /^[=+\-@\t\r]/;
  const cell = (value: string) => `"${(FORMULA.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
  const rows = [
    ['Date', 'Company', 'Position', 'URL', 'Profile'],
    ...log.map((a) => [a.date.slice(0, 10), a.company, a.position, a.url, a.profile ?? '']),
  ];
  return rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
