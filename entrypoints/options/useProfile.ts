import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import { loadProfile, saveProfile, watchProfile } from '@/src/profile/store';

export type SaveState = 'saved' | 'saving' | 'error';

const SAVE_DELAY_MS = 300;

/** Loads the profile and saves every change shortly after the user stops typing. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<SaveState>('saved');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
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
    return watchProfile((external) => show({ ...external, ...unsaved.current }));
  }, []);

  const update = (patch: Partial<Profile>) => {
    if (!latest.current) return;
    unsaved.current = { ...unsaved.current, ...patch };
    show({ ...latest.current, ...patch });
    setState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const next = latest.current!;
      unsaved.current = {};
      saveProfile(next).then(
        () => setState('saved'),
        () => setState('error'),
      );
    }, SAVE_DELAY_MS);
  };

  return { profile, state, update };
}
