import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import { emptyEducation, type Profile } from '@/src/profile/schema';
import { EDUCATION_LEVEL_OPTIONS } from '../fields';
import { EntryField, EntryList } from './EntryList';

/** Highest education level, then schools and degrees, most recent first. */
export function EducationSection({
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
    <Section
      id="education"
      number={number}
      meta={meta}
      title={t('section.education')}
      note={t('section.education.note')}
    >
      <label className="mb-6 block max-w-sm">
        <span className="mb-1.5 block text-sm font-medium text-ink">{t('field.educationLevel')}</span>
        <select
          className="field"
          value={profile.educationLevel}
          onChange={(e) => update({ educationLevel: e.target.value })}
        >
          {EDUCATION_LEVEL_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      <EntryList
        items={profile.education}
        onChange={(education) => update({ education })}
        heading={(n) => t('education.entry', { n })}
        create={() => emptyEducation(crypto.randomUUID())}
        addLabel={t('education.add')}
        noneLabel={t('education.none')}
        render={(study, patch) => (
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <EntryField label={t('field.school')}>
              <input className="field" value={study.school} onChange={(e) => patch({ school: e.target.value })} />
            </EntryField>
            <EntryField label={t('field.degree')}>
              <input className="field" value={study.degree} onChange={(e) => patch({ degree: e.target.value })} />
            </EntryField>
            <EntryField label={t('field.fieldOfStudy')}>
              <input
                className="field"
                value={study.fieldOfStudy}
                onChange={(e) => patch({ fieldOfStudy: e.target.value })}
              />
            </EntryField>
            <div className="grid grid-cols-2 gap-3">
              <EntryField label={t('list.from')}>
                <input
                  className="field"
                  type="month"
                  value={study.start}
                  onChange={(e) => patch({ start: e.target.value })}
                />
              </EntryField>
              <EntryField label={t('list.to')}>
                <input
                  className="field"
                  type="month"
                  value={study.end}
                  onChange={(e) => patch({ end: e.target.value })}
                />
              </EntryField>
            </div>
          </div>
        )}
      />
    </Section>
  );
}
