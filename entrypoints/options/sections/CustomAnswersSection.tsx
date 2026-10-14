import { Section } from '@/src/ui/components/Section';
import type { Profile } from '@/src/profile/schema';

export function CustomAnswersSection({
  profile,
  update,
}: {
  profile: Profile;
  update: (patch: Partial<Profile>) => void;
}) {
  const answers = profile.customAnswers;
  const setAnswers = (customAnswers: Profile['customAnswers']) => update({ customAnswers });

  return (
    <Section
      id="answers"
      title="Custom answers"
      note="For questions the built-in fields don't cover. An answer is used when a form label contains one of its keywords (separate several with commas)."
    >
      <ul className="space-y-3">
        {answers.map((entry, i) => (
          <li key={entry.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="field"
              aria-label="Keywords"
              placeholder="hear about us, how did you find"
              value={entry.keywords}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? { ...a, keywords: e.target.value } : a)))}
            />
            <input
              className="field"
              aria-label="Answer"
              placeholder="LinkedIn"
              value={entry.answer}
              onChange={(e) => setAnswers(answers.map((a, j) => (j === i ? { ...a, answer: e.target.value } : a)))}
            />
            <button className="btn-quiet" onClick={() => setAnswers(answers.filter((_, j) => j !== i))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      {answers.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No custom answers yet.</p>}
      <button
        className="btn-quiet mt-4"
        onClick={() => setAnswers([...answers, { id: crypto.randomUUID(), keywords: '', answer: '' }])}
      >
        Add answer
      </button>
    </Section>
  );
}
