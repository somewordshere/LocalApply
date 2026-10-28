import { Fragment, useEffect, useRef, useState } from 'react';
import {
  clearLog,
  loadLog,
  loadLogSetting,
  logToCsv,
  removeApplication,
  saveLogSetting,
  STATUSES,
  updateApplication,
  watchLog,
  type Application,
  type ApplicationStatus,
} from '@/src/core/applications';
import { loadIndex, watchIndex } from '@/src/profile/store';
import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';

const EXPORT_FILE_NAME = 'localapply-applications.csv';

/** Notes and the saved job description of one application, opened under its row. */
function ApplicationDetails({ application, columns }: { application: Application; columns: number }) {
  const { t } = useI18n();
  // Typed here and saved on leaving the box, so the log reloading on save can't move the cursor.
  const [notes, setNotes] = useState(application.notes ?? '');
  const saved = application.notes ?? '';
  const save = () => {
    if (notes !== saved) void updateApplication(application.id, { notes });
  };
  // Closing the details saves too, even when the box still has focus: the last text is kept for that moment.
  const pending = useRef({ id: application.id, notes, saved });
  useEffect(() => {
    pending.current = { id: application.id, notes, saved };
  });
  useEffect(
    () => () => {
      const last = pending.current;
      if (last.notes !== last.saved) void updateApplication(last.id, { notes: last.notes });
    },
    [],
  );
  return (
    <tr>
      <td colSpan={columns} className="px-2 pb-4">
        <label className="block text-xs font-medium text-ink-soft">
          {t('applications.notes')}
          <textarea
            className="field mt-1 min-h-20 text-sm"
            placeholder={t('applications.notesPlaceholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={save}
          />
        </label>
        <p className="mt-3 text-xs font-medium text-ink-soft">{t('applications.posting')}</p>
        {application.posting ? (
          <div className="mt-1 max-h-64 overflow-y-auto rounded-md border border-line bg-paper px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line text-ink">
            {application.posting}
          </div>
        ) : (
          <p className="mt-1 text-xs text-ink-faint">{t('applications.noPosting')}</p>
        )}
      </td>
    </tr>
  );
}

/** The forms LocalApply filled, newest first, with the switch that turns the log off. */
export function ApplicationsSection({ number }: { number: number }) {
  const { lang, t } = useI18n();
  const [log, setLog] = useState<Application[]>([]);
  const [on, setOn] = useState(true);
  const [several, setSeveral] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

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
                <th className="px-2 pb-2 font-medium">{t('applications.status')}</th>
                {several && <th className="px-2 pb-2 font-medium">{t('profiles.label')}</th>}
                <th className="px-2 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {log.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td className="px-2 py-2 whitespace-nowrap text-ink-soft tabular-nums">
                      {date.format(new Date(a.date))}
                    </td>
                    {/* The company links to the posting; without a company name, the site does. */}
                    <td className="px-2 py-2">
                      <a className="link" href={a.url} target="_blank" rel="noreferrer noopener" title={a.url}>
                        {a.company || host(a.url)}
                      </a>
                    </td>
                    <td className="px-2 py-2 text-ink">{a.position || '—'}</td>
                    <td className="px-2 py-1.5">
                      <select
                        className="field w-auto py-1 text-sm"
                        aria-label={t('applications.statusFor', { company: a.company || host(a.url) })}
                        value={a.status ?? 'applied'}
                        onChange={(e) => void updateApplication(a.id, { status: e.target.value as ApplicationStatus })}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t(`status.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    {several && <td className="px-2 py-2 text-ink-soft">{a.profile || t('profiles.main')}</td>}
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        className="link mr-3 text-xs"
                        aria-expanded={openId === a.id}
                        onClick={() => setOpenId(openId === a.id ? null : a.id)}
                      >
                        {openId === a.id ? t('applications.hide') : t('applications.details')}
                      </button>
                      <button className="link text-xs" onClick={() => void removeApplication(a.id)}>
                        {t('remove')}
                      </button>
                    </td>
                  </tr>
                  {openId === a.id && <ApplicationDetails application={a} columns={several ? 6 : 5} />}
                </Fragment>
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
