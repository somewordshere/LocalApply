import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { Profile } from '@/src/profile/schema';

export function CustomAnswersSection({
  number,
  profile,
  update,
}: {
  number: number;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { t } = useI18n();
  const answers = profile.customAnswers;
  const setAnswers = (customAnswers: Profile['customAnswers']) => update({ customAnswers });

  return (
    <Section id="answers" number={number} title={t('section.answers')} note={t('section.answers.note')}>
      <ul className="space-y-3">
        {answers.map((entry, i) => (
          <li key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="field"
              aria-label={t('answers.keywords')}
              placeholder={t('answers.keywordsPlaceholder')}
              value={entry.keywords}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? { ...a, keywords: e.target.value } : a)))}
            />
            <input
              className="field"
              aria-label={t('answers.answer')}
              placeholder={t('answers.answerPlaceholder')}
              value={entry.answer}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? { ...a, answer: e.target.value } : a)))}
            />
            <button className="btn-quiet" onClick={() => setAnswers(answers.filter((_, j) => j !== i))}>
              {t('remove')}
            </button>
          </li>
        ))}
      </ul>
      {answers.length === 0 && <p className="text-sm text-ink-faint">{t('answers.none')}</p>}
      <p className="mt-3 text-xs text-ink-faint">{t('documents.placeholders')}</p>
      <button
        className="btn-quiet mt-4"
        onClick={() => setAnswers([...answers, { id: crypto.randomUUID(), keywords: '', answer: '' }])}
      >
        {t('answers.add')}
      </button>
    </Section>
  );
}
