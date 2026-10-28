import { beforeEach, describe, expect, it, vi } from 'vitest';

// browser.storage.local in memory: enough for the log, which only gets and sets.
const store = new Map<string, unknown>();
vi.mock('wxt/browser', () => ({
  browser: {
    storage: {
      local: {
        get: async (key: string) => (store.has(key) ? { [key]: structuredClone(store.get(key)) } : {}),
        set: async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) store.set(key, structuredClone(value));
        },
      },
      onChanged: { addListener: () => {}, removeListener: () => {} },
    },
  },
}));

const {
  clearLog,
  earlierApplications,
  loadLog,
  logToCsv,
  logUrl,
  recordApplication,
  removeApplication,
  saveLogSetting,
} = await import('../../src/core/applications');

const HOUR = 60 * 60 * 1000;
const at = (hours: number) => new Date(Date.UTC(2026, 9, 22, 9) + hours * HOUR);

describe('application log', () => {
  beforeEach(() => store.clear());

  it('keeps entries newest first and refreshes the same page within a day', async () => {
    await recordApplication({ company: 'Acme', position: '', url: 'https://acme.example/jobs/1' }, at(0));
    await recordApplication({ company: 'Beta', position: 'QA', url: 'https://beta.example/apply' }, at(1));
    await recordApplication({ company: '', position: 'QA Engineer', url: 'https://acme.example/jobs/1' }, at(2));
    const log = await loadLog();
    expect(log.map((a) => [a.company, a.position, a.date])).toEqual([
      ['Acme', 'QA Engineer', at(2).toISOString()],
      ['Beta', 'QA', at(1).toISOString()],
    ]);

    await recordApplication({ company: 'Acme', position: 'QA Engineer', url: 'https://acme.example/jobs/1' }, at(30));
    expect((await loadLog()).length).toBe(3);
  });

  it('records nothing when switched off, and removes or clears on request', async () => {
    await recordApplication({ company: 'Acme', position: '', url: 'https://acme.example/' }, at(0));
    await saveLogSetting(false);
    await recordApplication({ company: 'Beta', position: '', url: 'https://beta.example/' }, at(1));
    const [only] = await loadLog();
    expect(only.company).toBe('Acme');
    await removeApplication(only.id);
    expect(await loadLog()).toEqual([]);
    await saveLogSetting(true);
    await recordApplication({ company: 'Beta', position: '', url: 'https://beta.example/' }, at(2));
    await clearLog();
    expect(await loadLog()).toEqual([]);
  });

  it('keeps addresses without query or fragment, which can carry tokens', () => {
    expect(logUrl('https://jobs.example/apply/7?token=secret#step2')).toBe('https://jobs.example/apply/7');
    expect(logUrl('not a url')).toBe('');
  });

  it('exports CSV that spreadsheets read safely', () => {
    const csv = logToCsv([
      {
        id: '1',
        date: at(0).toISOString(),
        company: 'Acme, "Inc"',
        position: '=HYPERLINK("x")',
        url: 'https://a.example/',
      },
    ]);
    expect(csv).toBe(
      '"Date","Company","Position","URL","Profile"\r\n"2026-10-22","Acme, ""Inc""","\'=HYPERLINK(""x"")","https://a.example/",""\r\n',
    );
  });
});

describe('earlier applications', () => {
  const entry = (company: string, url: string, hours: number) => ({
    id: `${company}-${hours}`,
    date: at(hours).toISOString(),
    company,
    position: 'QA',
    url,
  });
  const log = [
    entry('ACME GmbH', 'https://acme.example/jobs/2', 20),
    entry('Beta', 'https://beta.example/apply', 10),
    entry('', 'https://jobs.example/7', 0),
  ];

  it('finds the same employer under any posting, ignoring legal form and case', () => {
    const found = earlierApplications(log, { company: 'Acme', url: 'https://acme.example/jobs/9' }, at(30));
    expect(found.map((a) => a.id)).toEqual(['ACME GmbH-20']);
  });

  it('finds the same posting from an earlier day, but not a refill the same day', () => {
    expect(earlierApplications(log, { url: 'https://jobs.example/7' }, at(30)).map((a) => a.id)).toEqual(['-0']);
    expect(earlierApplications(log, { url: 'https://jobs.example/7' }, at(2))).toEqual([]);
  });

  it('finds nothing for a page that names no employer and is new', () => {
    expect(earlierApplications(log, { url: 'https://new.example/' }, at(30))).toEqual([]);
  });
});
