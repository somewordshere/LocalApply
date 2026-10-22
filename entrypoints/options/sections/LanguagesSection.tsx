import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { MessageKey } from '@/src/ui/i18n';
import { LANGUAGE_LEVELS, type LanguageLevel, type Profile } from '@/src/profile/schema';

const LEVEL_LABELS: Record<Exclude<LanguageLevel, ''>, MessageKey> = {
  native: 'level.native',
  C2: 'level.C2',
  C1: 'level.C1',
  B2: 'level.B2',
  B1: 'level.B1',
  A2: 'level.A2',
  A1: 'level.A1',
};

/** Spoken languages with their level, for "Languages" boxes and proficiency questions. */
export function LanguagesSection({
  number,
  profile,
  update,
}: {
  number: number;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  const languages = profile.languages;
  const setLanguages = (next: Profile['languages']) => update({ languages: next });

  return (
    <Section id="languages" number={number} title={t('section.languages')} note={t('section.languages.note')}>
      <ul className="space-y-3">
        {languages.map((entry, i) => (
          <li key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
            <input
              className="field"
              aria-label={t('languages.language')}
              placeholder={t('languages.languagePlaceholder')}
              value={entry.language}
              onChange={(e) =>
                setLanguages(languages.map((l, j) => (j === i ? { ...l, language: e.target.value } : l)))
              }
            />
            <select
              className="field"
              aria-label={t('languages.level')}
              value={entry.level}
              onChange={(e) =>
                setLanguages(languages.map((l, j) => (j === i ? { ...l, level: e.target.value as LanguageLevel } : l)))
              }
            >
              <option value="">{t('notSet')}</option>
              {LANGUAGE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(LEVEL_LABELS[level])}
                </option>
              ))}
            </select>
            <button className="btn-quiet" onClick={() => setLanguages(languages.filter((_, j) => j !== i))}>
              {t('remove')}
            </button>
          </li>
        ))}
      </ul>
      {languages.length === 0 && <p className="text-sm text-ink-faint">{t('languages.none')}</p>}
      <button
        className="btn-quiet mt-4"
        onClick={() => setLanguages([...languages, { id: crypto.randomUUID(), language: '', level: '' }])}
      >
        {t('languages.add')}
      </button>
    </Section>
  );
}
