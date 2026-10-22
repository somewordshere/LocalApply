import { useEffect, useState } from 'react';
import {
  clearLog,
  loadLog,
  loadLogSetting,
  logToCsv,
  removeApplication,
  saveLogSetting,
  watchLog,
  type Application,
} from '@/src/core/applications';
import { loadIndex, watchIndex } from '@/src/profile/store';
import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';

const EXPORT_FILE_NAME = 'localapply-applications.csv';

/** The forms LocalApply filled, newest first, with the switch that turns the log off. */
export function ApplicationsSection({ number }: { number: number }) {
  const { lang, t } = useI18n();
  const [log, setLog] = useState<Application[]>([]);
  const [on, setOn] = useState(true);
  const [several, setSeveral] = useState(false);

  useEffect(() => {
    const load = () => {
      void loadLog().then(setLog);
      void loadLogSetting().then(setOn);
    };
    load();
    void loadIndex().then((index) => setSeveral(index.list.length > 1));
    const stopIndex = watchIndex((index) => setSeveral(index.list.length > 1));
    const stopLog = watchLog(load);
    return () => {
      stopIndex();
      stopLog();
    };
  }, []);

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([logToCsv(log)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium' });
  const host = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <Section id="applications" number={number} title={t('section.applications')} note={t('section.applications.note')}>
      <label className="mb-5 flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            void saveLogSetting(e.target.checked);
          }}
        />
        {t('applications.keep')}
      </label>

      {log.length === 0 ? (
        <p className="text-sm text-ink-faint">{t('applications.none')}</p>
      ) : (
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs text-ink-faint">
              <tr>
                <th className="px-2 pb-2 font-medium">{t('applications.date')}</th>
                <th className="px-2 pb-2 font-medium">{t('applications.company')}</th>
                <th className="px-2 pb-2 font-medium">{t('applications.position')}</th>
                <th className="px-2 pb-2 font-medium">{t('applications.page')}</th>
                {several && <th className="px-2 pb-2 font-medium">{t('profiles.label')}</th>}
                <th className="px-2 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {log.map((a) => (
                <tr key={a.id}>
                  <td className="px-2 py-2 whitespace-nowrap text-ink-soft tabular-nums">
                    {date.format(new Date(a.date))}
                  </td>
                  <td className="px-2 py-2 text-ink">{a.company || '—'}</td>
                  <td className="px-2 py-2 text-ink">{a.position || '—'}</td>
                  <td className="max-w-48 truncate px-2 py-2">
                    <a className="link" href={a.url} target="_blank" rel="noreferrer noopener" title={a.url}>
                      {host(a.url)}
                    </a>
                  </td>
                  {several && <td className="px-2 py-2 text-ink-soft">{a.profile || t('profiles.main')}</td>}
                  <td className="px-2 py-2 text-right">
                    <button className="link text-xs" onClick={() => void removeApplication(a.id)}>
                      {t('remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn-quiet" onClick={exportCsv} disabled={log.length === 0}>
          {t('applications.export')}
        </button>
        <button
          className="cursor-pointer text-sm font-medium text-danger underline-offset-3 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          disabled={log.length === 0}
          onClick={() => {
            if (confirm(t('applications.confirmClear'))) void clearLog();
          }}
        >
          {t('applications.clear')}
        </button>
      </div>
    </Section>
  );
}
