import { browser } from 'wxt/browser';
import { migrate, type Profile } from './schema';

const KEY = 'profile';
/** Changes with every save, so a page can tell its own writes from those of the popup. */
const REVISION_KEY = 'profileRevision';

const ownRevisions = new Set<string>();

export async function loadProfile(): Promise<Profile> {
  const stored = await browser.storage.local.get(KEY);
  return migrate(stored[KEY]);
}

export async function saveProfile(profile: Profile): Promise<void> {
  const revision = crypto.randomUUID();
  ownRevisions.add(revision);
  await browser.storage.local.set({ [KEY]: profile, [REVISION_KEY]: revision });
}

/** Calls back whenever another page (the popup, a second profile tab) saves the profile. Returns a stop function. */
export function watchProfile(onChange: (profile: Profile) => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    if (area !== 'local' || !changes[KEY]) return;
    const revision = changes[REVISION_KEY]?.newValue;
    if (typeof revision === 'string' && ownRevisions.has(revision)) return;
    onChange(migrate(changes[KEY].newValue));
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
