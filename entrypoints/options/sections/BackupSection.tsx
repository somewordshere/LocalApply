import { useState } from 'react';
import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { MessageKey } from '@/src/ui/i18n';
import { emptyProfile, migrate, type Profile } from '@/src/profile/schema';

const EXPORT_FILE_NAME = 'localapply-profile.json';

export function BackupSection({
  number,
  profile,
  update,
}: {
  number: number;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  const [notice, setNotice] = useState<MessageKey | null>(null);

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = EXPORT_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    try {
      update(migrate(JSON.parse(await file.text())));
      setNotice('backup.imported');
    } catch {
      setNotice('backup.importFailed');
    }
  };

  return (
    <Section id="data" number={number} title={t('section.backup')} note={t('section.backup.note')}>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-quiet" onClick={exportJson}>
          {t('backup.export')}
        </button>
        <label className="btn-quiet">
          {t('backup.import')}
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => importJson(e.target.files?.[0])}
          />
        </label>
        <button
          className="cursor-pointer text-sm font-medium text-danger underline-offset-3 hover:underline"
          onClick={() => {
            if (confirm(t('backup.confirmDelete'))) update({ ...emptyProfile, customAnswers: [] });
          }}
        >
          {t('backup.deleteAll')}
        </button>
        {notice && (
          <span role="status" className="text-sm text-ink-soft">
            {t(notice)}
          </span>
        )}
      </div>
    </Section>
  );
}
