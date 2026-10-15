import { FIELD_SECTIONS } from './fields';
import { BackupSection } from './sections/BackupSection';
import { CustomAnswersSection } from './sections/CustomAnswersSection';
import { DocumentsSection } from './sections/DocumentsSection';
import { FieldSection } from './sections/FieldSection';
import { useProfile } from './useProfile';

const EXTRA_SECTIONS: { id: string; title: string; navTitle?: string }[] = [
  { id: 'documents', title: 'Documents' },
  { id: 'answers', title: 'Custom answers', navTitle: 'Answers' },
  { id: 'data', title: 'Backup' },
];

export default function App() {
  const { profile, state, update } = useProfile();

  if (!profile) return <p className="p-8 text-sm">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Stored only in this browser. Used to fill application forms when you click Fill.
        </p>
      </header>

      {/* Stays in view while scrolling, so the sections and the save status are always one glance away. */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <nav aria-label="Sections" className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {[...FIELD_SECTIONS, ...EXTRA_SECTIONS].map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-1.5 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {s.navTitle ?? s.title}
            </a>
          ))}
        </nav>
        <span
          role="status"
          className={`shrink-0 text-xs ${state === 'error' ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {state === 'saving' ? 'Saving…' : state === 'error' ? 'Could not save' : 'All changes saved'}
        </span>
      </div>

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
