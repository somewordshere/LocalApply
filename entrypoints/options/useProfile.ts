import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import { loadProfile, saveProfile, watchProfile } from '@/src/profile/store';

export type SaveState = 'saved' | 'saving' | 'error';

const SAVE_DELAY_MS = 300;
/** How long the save status stays highlighted after a save. */
const JUST_SAVED_MS = 1800;

/**
 * Loads the profile and saves every change shortly after the user stops typing.
 * `justSaved` is true for a moment after a save finishes, never on page load.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<SaveState>('saved');
  const [justSaved, setJustSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const justSavedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Counts edits, so a save that finishes while a newer edit waits does not claim "saved".
  const edits = useRef(0);
  // The newest profile, also for updates that arrive after an await (file reads).
  const latest = useRef<Profile | null>(null);
  // Edits typed here but not saved yet; they win over a save from elsewhere.
  const unsaved = useRef<Partial<Profile>>({});

  const show = (next: Profile) => {
    latest.current = next;
    setProfile(next);
  };

  useEffect(() => {
    loadProfile().then(show);
    // The popup saves answers too; take them in so the next save here does not overwrite them.
    const stop = watchProfile((external) => show({ ...external, ...unsaved.current }));
    return () => {
      stop();
      clearTimeout(justSavedTimer.current);
    };
  }, []);

  const update = (patch: Partial<Profile>) => {
    if (!latest.current) return;
    unsaved.current = { ...unsaved.current, ...patch };
    show({ ...latest.current, ...patch });
    setState('saving');
    setJustSaved(false);
    const edit = ++edits.current;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = latest.current!;
      unsaved.current = {};
      saveProfile(next).then(
        () => {
          if (edit !== edits.current) return;
          setState('saved');
          setJustSaved(true);
          clearTimeout(justSavedTimer.current);
          justSavedTimer.current = setTimeout(() => setJustSaved(false), JUST_SAVED_MS);
        },
        () => setState('error'),
      );
    }, SAVE_DELAY_MS);
  };

  return { profile, state, justSaved, update };
}
