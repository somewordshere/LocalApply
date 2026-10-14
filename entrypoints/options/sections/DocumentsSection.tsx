import { FileField } from '@/src/ui/components/FileField';
import { Section } from '@/src/ui/components/Section';
import type { Profile } from '@/src/profile/schema';

export function DocumentsSection({ profile, update }: { profile: Profile; update: (patch: Partial<Profile>) => void }) {
  return (
    <Section id="documents" title="Documents">
      <div className="space-y-5">
        <FileField label="CV / résumé" value={profile.cv} onChange={(cv) => update({ cv })} />
        <FileField
          label="Cover letter file"
          value={profile.coverLetterFile}
          onChange={(coverLetterFile) => update({ coverLetterFile })}
        />
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cover letter text</span>
          <textarea
            className="field min-h-40"
            value={profile.coverLetterText}
            onChange={(e) => update({ coverLetterText: e.target.value })}
          />
        </label>
      </div>
    </Section>
  );
}
