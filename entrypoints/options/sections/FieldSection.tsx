import { Section } from '@/src/ui/components/Section';
import type { Profile } from '@/src/profile/schema';
import type { FieldSectionDef } from '../fields';

export function FieldSection({
  section,
  profile,
  update,
}: {
  section: FieldSectionDef;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  return (
    <Section id={section.id} title={section.title} note={section.note}>
      <div className="grid gap-4 sm:grid-cols-2">
        {section.fields.map((f) => (
          <label key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
            <span className="mb-1 block text-sm font-medium">{f.label}</span>
            {f.options ? (
              <select className="field" value={profile[f.key]} onChange={(e) => update({ [f.key]: e.target.value })}>
                {f.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="field"
                type={f.type ?? 'text'}
                placeholder={f.placeholder}
                value={profile[f.key]}
                onChange={(e) => update({ [f.key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
    </Section>
  );
}
