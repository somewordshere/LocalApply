import { useState } from 'react';
import { Section } from '@/src/ui/components/Section';
import { useI18n } from '@/src/ui/I18nProvider';
import type { Profile } from '@/src/profile/schema';

/** With more answers than this, a search box helps find one. */
const SEARCH_FROM = 5;

/** Rows an answer box gets: enough for its text, within limits. */
const rowsFor = (text: string) => Math.min(8, Math.max(1, Math.ceil(text.length / 70), text.split('\n').length));

export function CustomAnswersSection({
  number,
  profile,
  update,
}: {
  number: number;
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const { lang, t } = useI18n();
  const [query, setQuery] = useState('');
  const answers = profile.customAnswers;
  const setAnswers = (customAnswers: Profile['customAnswers']) => update({ customAnswers });
  const change = (id: string, patch: Partial<Profile['customAnswers'][number]>) =>
    setAnswers(answers.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium' });
  const needle = query.trim().toLowerCase();
  const shown = needle ? answers.filter((a) => `${a.keywords}\n${a.answer}`.toLowerCase().includes(needle)) : answers;

  return (
    <Section id="answers" number={number} title={t('section.answers')} note={t('section.answers.note')}>
      {answers.length > SEARCH_FROM && (
        <input
          type="search"
          className="field mb-4"
          aria-label={t('answers.search')}
          placeholder={t('answers.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <ul className="space-y-4">
        {shown.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-line p-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="field"
                aria-label={t('answers.keywords')}
                placeholder={t('answers.keywordsPlaceholder')}
                value={entry.keywords}
                onChange={(e) => change(entry.id, { keywords: e.target.value })}
              />
              <button className="btn-quiet" onClick={() => setAnswers(answers.filter((a) => a.id !== entry.id))}>
                {t('remove')}
              </button>
            </div>
            <textarea
              className="field mt-2"
              aria-label={t('answers.answer')}
              placeholder={t('answers.answerPlaceholder')}
              rows={rowsFor(entry.answer)}
              value={entry.answer}
              onChange={(e) => change(entry.id, { answer: e.target.value })}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              {entry.uses && entry.lastUsed
                ? t('answers.used', { n: entry.uses, date: date.format(new Date(entry.lastUsed)) })
                : t('answers.unused')}
            </p>
          </li>
        ))}
      </ul>
      {answers.length === 0 && <p className="text-sm text-ink-faint">{t('answers.none')}</p>}
      {answers.length > 0 && shown.length === 0 && <p className="text-sm text-ink-faint">{t('answers.noMatch')}</p>}
      <p className="mt-3 text-xs text-ink-faint">{t('documents.placeholders')}</p>
      <button
        className="btn-quiet mt-4"
        onClick={() => {
          setQuery('');
          setAnswers([...answers, { id: crypto.randomUUID(), keywords: '', answer: '' }]);
        }}
      >
        {t('answers.add')}
      </button>
    </Section>
  );
}
