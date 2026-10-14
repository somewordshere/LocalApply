import { FIELD_SECTIONS } from './fields';
import { BackupSection } from './sections/BackupSection';
import { CustomAnswersSection } from './sections/CustomAnswersSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { FieldSection } from './sections/FieldSection';
import { useProfile } from './useProfile';

const EXTRA_SECTIONS = [
  { id: 'documents', title: 'Documents' },
  { id: 'answers', title: 'Custom answers' },
  { id: 'data', title: 'Backup' },
];

export default function App() {
  const { profile, state, update } = useProfile();

  if (!profile) return <p className="p-8 text-sm">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Your profile</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Stored only in this browser. Used to fill application forms when you click Fill.
          </p>
        </div>
        <span role="status" className="text-sm text-slate-500 dark:text-slate-400">
          {state === 'saving' ? 'Saving…' : state === 'error' ? 'Could not save' : 'All changes saved'}
        </span>
      </header>

      <nav aria-label="Sections" className="mb-6 flex flex-wrap gap-2">
        {[...FIELD_SECTIONS, ...EXTRA_SECTIONS].map((s) => (
          <a key={s.id} href={`#${s.id}`} className="btn-quiet">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-6">
        {FIELD_SECTIONS.map((section) => (
          <FieldSection key={section.id} section={section} profile={profile} update={update} />
        ))}
        <DocumentsSection profile={profile} update={update} />
        <CustomAnswersSection profile={profile} update={update} />
        <BackupSection profile={profile} update={update} />
      </div>
    </div>
  );
}
