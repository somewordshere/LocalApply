import { browser } from 'wxt/browser';
import { migrate, type Profile } from './schema';

/** Before 0.8.0 the only profile lived here; it becomes the first profile ("Main") on first load. */
const LEGACY_KEY = 'profile';
/** Which profiles exist, in order, and which one fills forms. */
const INDEX_KEY = 'profileIndex';
/** Changes with every save, so a page can tell its own writes from those of the popup. */
const REVISION_KEY = 'profileRevision';
const FIRST_ID = 'main';
const keyOf = (id: string) => `profile:${id}`;

export interface ProfileRef {
  id: string;
  /** Empty for the first profile, which the interface calls "Main" in its own language. */
  name: string;
}

export interface ProfileIndex {
  active: string;
  list: ProfileRef[];
}

const ownRevisions = new Set<string>();

function isIndex(value: unknown): value is ProfileIndex {
  const index = value as ProfileIndex;
  return (
    Boolean(index) &&
    typeof index.active === 'string' &&
    Array.isArray(index.list) &&
    index.list.length > 0 &&
    index.list.every((p) => typeof p?.id === 'string' && typeof p.name === 'string') &&
    index.list.some((p) => p.id === index.active)
  );
}

/** The profiles and the active one. The first call after updating from 0.7 or earlier moves the old profile in. */
export async function loadIndex(): Promise<ProfileIndex> {
  const stored = await browser.storage.local.get([INDEX_KEY, LEGACY_KEY]);
  if (isIndex(stored[INDEX_KEY])) return stored[INDEX_KEY];
  const index: ProfileIndex = { active: FIRST_ID, list: [{ id: FIRST_ID, name: '' }] };
  const legacy = stored[LEGACY_KEY];
  // The index is written before the old key goes, so a page loading at the same moment sees one or the other.
  await browser.storage.local.set({
    [INDEX_KEY]: index,
    ...(legacy !== undefined ? { [keyOf(FIRST_ID)]: legacy } : {}),
  });
  if (legacy !== undefined) await browser.storage.local.remove(LEGACY_KEY);
  return index;
}

/** Calls back when profiles are added, renamed, removed or switched, here or on another page. */
export function watchIndex(onChange: (index: ProfileIndex) => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    const next = changes[INDEX_KEY]?.newValue;
    if (area === 'local' && isIndex(next)) onChange(next);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

export async function loadProfileById(id: string): Promise<Profile> {
  const key = keyOf(id);
  const stored = await browser.storage.local.get(key);
  return migrate(stored[key]);
}

/** The profile that fills forms. */
export async function loadProfile(): Promise<Profile> {
  return loadProfileById((await loadIndex()).active);
}

/** Saves into the given profile, or the active one. Pages pass the id they loaded, so a switch can't redirect a save. */
export async function saveProfile(profile: Profile, id?: string): Promise<void> {
  const target = id ?? (await loadIndex()).active;
  const revision = crypto.randomUUID();
  ownRevisions.add(revision);
  await browser.storage.local.set({ [keyOf(target)]: profile, [REVISION_KEY]: revision });
}

/**
 * Calls back when another page (the popup, a second profile tab) saves the active profile, or when another
 * profile becomes active, with that profile and its id. Returns a stop function.
 */
export function watchProfile(onChange: (profile: Profile, id: string) => void): () => void {
  let active: string | undefined;
  void loadIndex().then((index) => (active ??= index.active));
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    if (area !== 'local') return;
    const index = changes[INDEX_KEY]?.newValue;
    if (isIndex(index) && index.active !== active) {
      // The index being created (first load after an update) is not a switch: the page already shows that profile.
      const switched = active !== undefined || isIndex(changes[INDEX_KEY]?.oldValue);
      const id = (active = index.active);
      if (switched) void loadProfileById(id).then((profile) => onChange(profile, id));
      return;
    }
    if (!active || !changes[keyOf(active)]) return;
    const revision = changes[REVISION_KEY]?.newValue;
    if (typeof revision === 'string' && ownRevisions.has(revision)) return;
    onChange(migrate(changes[keyOf(active)].newValue), active);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

/** The active profile's name, '' for the first profile. */
export async function activeProfileName(): Promise<string> {
  const index = await loadIndex();
  return index.list.find((p) => p.id === index.active)?.name ?? '';
}

export async function switchProfile(id: string): Promise<void> {
  const index = await loadIndex();
  if (index.active === id || !index.list.some((p) => p.id === id)) return;
  await browser.storage.local.set({ [INDEX_KEY]: { ...index, active: id } });
}

/** Adds a profile, empty or a copy, and makes it the active one. Resolves to its id. */
export async function createProfile(name: string, copyOf?: Profile): Promise<string> {
  const index = await loadIndex();
  const id = crypto.randomUUID();
  // The profile is stored before the index points at it, so watchers never load a missing profile.
  await browser.storage.local.set({ [keyOf(id)]: copyOf ? migrate(structuredClone(copyOf)) : migrate(undefined) });
  await browser.storage.local.set({ [INDEX_KEY]: { active: id, list: [...index.list, { id, name: name.trim() }] } });
  return id;
}

export async function renameProfile(id: string, name: string): Promise<void> {
  const index = await loadIndex();
  const list = index.list.map((p) => (p.id === id ? { ...p, name: name.trim() } : p));
  await browser.storage.local.set({ [INDEX_KEY]: { ...index, list } });
}

/** Removes a profile and everything in it. The last profile can't be removed. */
export async function deleteProfile(id: string): Promise<void> {
  const index = await loadIndex();
  const list = index.list.filter((p) => p.id !== id);
  if (!list.length || list.length === index.list.length) return;
  await browser.storage.local.set({ [INDEX_KEY]: { active: index.active === id ? list[0].id : index.active, list } });
  await browser.storage.local.remove(keyOf(id));
}

/** "Delete all data": every profile goes, and one empty "Main" profile is left. */
export async function resetProfiles(): Promise<void> {
  const index = await loadIndex();
  await browser.storage.local.set({
    [keyOf(FIRST_ID)]: migrate(undefined),
    [INDEX_KEY]: { active: FIRST_ID, list: [{ id: FIRST_ID, name: '' }] },
  });
  const others = index.list.filter((p) => p.id !== FIRST_ID).map((p) => keyOf(p.id));
  if (others.length) await browser.storage.local.remove(others);
}
