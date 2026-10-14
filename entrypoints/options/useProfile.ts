import { useEffect, useRef, useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import { loadProfile, saveProfile } from '@/src/profile/store';

export type SaveState = 'saved' | 'saving' | 'error';

const SAVE_DELAY_MS = 300;

/** Loads the profile and saves every change shortly after the user stops typing. */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<SaveState>('saved');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  const update = (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    setState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveProfile(next).then(
        () => setState('saved'),
        () => setState('error'),
      );
    }, SAVE_DELAY_MS);
  };

  return { profile, state, update };
}
