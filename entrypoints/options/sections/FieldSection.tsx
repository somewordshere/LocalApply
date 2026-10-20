import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { MessageKey } from '@/src/ui/i18n';
import type { Profile } from '@/src/profile/schema';
import type { FieldDef, FieldSectionDef } from '../fields';
import { PhoneField } from './PhoneField';

const BRANDS = new Set<FieldDef['label']>(['LinkedIn', 'GitHub', 'Xing']);

export function FieldSection({
  section,
  number,
  meta,
  profile,
  update,
}: {
  section: FieldSectionDef;
  number: number;
  meta?: string;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  const label = (f: FieldDef) => (BRANDS.has(f.label) ? f.label : t(f.label as MessageKey));

  return (
    <Section
      id={section.id}
      number={number}
      meta={meta}
      title={t(section.title)}
      note={section.note && t(section.note)}
    >
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {section.fields.map((f) =>
          f.phone ? (
            <div key={f.key} className="sm:col-span-2">
              <PhoneField profile={profile} update={update} />
            </div>
          ) : (
            <label key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
              <span className="mb-1.5 block text-sm font-medium text-ink">{label(f)}</span>
              {f.options ? (
                <select className="field" value={profile[f.key]} onChange={(e) => update({ [f.key]: e.target.value })}>
                  {f.options.map(([value, option]) => (
                    <option key={value} value={value}>
                      {t(option)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field"
                  type={f.type ?? 'text'}
                  placeholder={f.placeholder ? t(f.placeholder) : f.example}
                  value={profile[f.key]}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                />
              )}
            </label>
          ),
        )}
      </div>
    </Section>
  );
}
