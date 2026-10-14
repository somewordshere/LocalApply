import { browser } from 'wxt/browser';
import { migrate, type Profile } from './schema';

const KEY = 'profile';

export async function loadProfile(): Promise<Profile> {
  const stored = await browser.storage.local.get(KEY);
  return migrate(stored[KEY]);
}

export async function saveProfile(profile: Profile): Promise<void> {
  await browser.storage.local.set({ [KEY]: profile });
}
