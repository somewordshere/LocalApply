import { FileField } from '@/src/ui/components/FileField';
import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { Profile } from '@/src/profile/schema';

export function DocumentsSection({
  number,
  meta,
  profile,
  update,
}: {
  number: number;
  meta?: string;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  return (
    <Section id="documents" number={number} meta={meta} title={t('section.documents')}>
      <div className="space-y-6">
        <FileField label={t('documents.cv')} value={profile.cv} onChange={(cv) => update({ cv })} />
        <FileField
          label={t('documents.coverLetterFile')}
          value={profile.coverLetterFile}
          onChange={(coverLetterFile) => update({ coverLetterFile })}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{t('documents.coverLetterText')}</span>
          <textarea
            className="field min-h-40"
            value={profile.coverLetterText}
            onChange={(e) => update({ coverLetterText: e.target.value })}
          />
          <span className="mt-1.5 block text-xs text-ink-faint">{t('documents.placeholders')}</span>
        </label>
      </div>
    </Section>
  );
}
