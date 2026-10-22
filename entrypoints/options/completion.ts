import { emptyProfile, type Profile } from '@/src/profile/schema';
import { FIELD_SECTIONS, type FieldSectionDef } from './fields';

export interface Progress {
  filled: number;
  total: number;
}

/** Sections whose fields are nobody's business unless the person chooses; they never count. */
export const OPTIONAL_SECTIONS = new Set(['voluntary']);

const has = (value: unknown) => (typeof value === 'string' ? value.trim() !== '' : Boolean(value));

export function sectionProgress(section: FieldSectionDef, profile: Profile): Progress {
  return { filled: section.fields.filter((f) => has(profile[f.key])).length, total: section.fields.length };
}

export function documentsProgress(profile: Profile): Progress {
  return { filled: [profile.cv, profile.coverLetterFile, profile.coverLetterText].filter(has).length, total: 3 };
}

/** Nothing entered yet: every field still has its default (defaults such as the EUR currency don't count as entered). */
export function isUntouched(profile: Profile): boolean {
  return (Object.keys(emptyProfile) as (keyof Profile)[]).every(
    (key) => key === 'version' || JSON.stringify(profile[key]) === JSON.stringify(emptyProfile[key]),
  );
}

/** How much of the profile is filled in, as a whole percentage, leaving out optional sections. */
export function completion(profile: Profile): number {
  const parts = [
    ...FIELD_SECTIONS.filter((s) => !OPTIONAL_SECTIONS.has(s.id)).map((s) => sectionProgress(s, profile)),
    documentsProgress(profile),
  ];
  const filled = parts.reduce((sum, p) => sum + p.filled, 0);
  const total = parts.reduce((sum, p) => sum + p.total, 0);
  return total ? Math.round((filled / total) * 100) : 0;
}
