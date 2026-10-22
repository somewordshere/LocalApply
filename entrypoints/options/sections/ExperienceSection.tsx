import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import { emptyWork, type Profile } from '@/src/profile/schema';
import { EntryField, EntryList } from './EntryList';

/** Jobs, most recent first; the first one also answers "Current employer" and "Current job title". */
export function ExperienceSection({
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
      id="experience"
      number={number}
      meta={meta}
      title={t('section.experience')}
      note={t('section.experience.note')}
    >
      <EntryList
        items={profile.experience}
        onChange={(experience) => update({ experience })}
        heading={(n) => t('experience.entry', { n })}
        create={() => emptyWork(crypto.randomUUID())}
        addLabel={t('experience.add')}
        noneLabel={t('experience.none')}
        render={(job, patch) => (
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <EntryField label={t('experience.title')}>
              <input className="field" value={job.title} onChange={(e) => patch({ title: e.target.value })} />
            </EntryField>
            <EntryField label={t('experience.employer')}>
              <input className="field" value={job.employer} onChange={(e) => patch({ employer: e.target.value })} />
            </EntryField>
            <EntryField label={t('experience.location')}>
              <input className="field" value={job.location} onChange={(e) => patch({ location: e.target.value })} />
            </EntryField>
            <div className="grid grid-cols-2 gap-3">
              <EntryField label={t('list.from')}>
                <input
                  className="field"
                  type="month"
                  value={job.start}
                  onChange={(e) => patch({ start: e.target.value })}
                />
              </EntryField>
              <EntryField label={t('list.to')}>
                <input
                  className="field disabled:opacity-50"
                  type="month"
                  value={job.current ? '' : job.end}
                  disabled={job.current}
                  onChange={(e) => patch({ end: e.target.value })}
                />
              </EntryField>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-accent"
                checked={job.current}
                onChange={(e) => patch({ current: e.target.checked })}
              />
              {t('experience.current')}
            </label>
            <EntryField label={t('experience.description')} wide>
              <textarea
                className="field min-h-24"
                value={job.description}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </EntryField>
          </div>
        )}
      />
    </Section>
  );
}
