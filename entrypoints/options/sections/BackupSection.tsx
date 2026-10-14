import { useState } from 'react';
import { Section } from '@/src/ui/components/Section';
import { emptyProfile, migrate, type Profile } from '@/src/profile/schema';

const EXPORT_FILE_NAME = 'localapply-profile.json';

export function BackupSection({ profile, update }: { profile: Profile; update: (patch: Partial<Profile>) => void }) {
  const [notice, setNotice] = useState('');

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
      setNotice('Profile imported.');
    } catch {
      setNotice('That file is not a valid profile export.');
    }
  };

  return (
    <Section id="data" title="Backup" note="The export contains everything above, including your documents.">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-quiet" onClick={exportJson}>
          Export profile
        </button>
        <label className="btn-quiet">
          Import profile
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => importJson(e.target.files?.[0])}
          />
        </label>
        <button
          className="cursor-pointer text-sm text-red-600 hover:underline dark:text-red-400"
          onClick={() => {
            if (confirm('Delete all stored profile data?')) update({ ...emptyProfile, customAnswers: [] });
          }}
        >
          Delete all data
        </button>
        {notice && (
          <span role="status" className="text-sm text-slate-600 dark:text-slate-300">
            {notice}
          </span>
        )}
      </div>
    </Section>
  );
}
