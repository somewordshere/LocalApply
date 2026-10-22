import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { emptyProfile } from '../../src/profile/schema';
import {
  activeProfileName,
  createProfile,
  deleteProfile,
  loadIndex,
  loadProfile,
  renameProfile,
  resetProfiles,
  saveProfile,
  switchProfile,
  watchProfile,
} from '../../src/profile/store';

vi.mock('wxt/browser', () => ({ browser: fakeBrowser }));

const stored = async (key: string) => (await fakeBrowser.storage.local.get(key))[key];

describe('several profiles', () => {
  beforeEach(() => fakeBrowser.reset());

  it('moves the profile of 0.7 and earlier into a first profile called Main', async () => {
    await fakeBrowser.storage.local.set({ profile: { version: 2, firstName: 'Old' } });
    expect((await loadProfile()).firstName).toBe('Old');
    expect(await loadIndex()).toEqual({ active: 'main', list: [{ id: 'main', name: '' }] });
    expect(await stored('profile')).toBeUndefined();
    expect(await activeProfileName()).toBe('');
  });

  it('creates profiles empty or as copies, switches, renames and deletes them', async () => {
    await saveProfile({ ...emptyProfile, firstName: 'Max' });
    const copy = await createProfile('  German CV ', { ...emptyProfile, firstName: 'Max' });
    expect((await loadIndex()).active).toBe(copy);
    expect((await loadProfile()).firstName).toBe('Max');
    expect(await activeProfileName()).toBe('German CV');

    const empty = await createProfile('QA');
    expect((await loadProfile()).firstName).toBe('');
    await saveProfile({ ...emptyProfile, firstName: 'Quinn' });

    await switchProfile('main');
    expect((await loadProfile()).firstName).toBe('Max');
    await renameProfile(empty, 'QA roles');
    expect((await loadIndex()).list.map((p) => p.name)).toEqual(['', 'German CV', 'QA roles']);

    await switchProfile(copy);
    await deleteProfile(copy);
    const index = await loadIndex();
    expect(index.list.map((p) => p.id)).toEqual(['main', empty]);
    expect(index.active).toBe('main');
    expect(await stored(`profile:${copy}`)).toBeUndefined();

    await deleteProfile(empty);
    await deleteProfile('main');
    expect((await loadIndex()).list.map((p) => p.id)).toEqual(['main']);
  });

  it('saves into the profile a page loaded, even after another became active', async () => {
    await saveProfile({ ...emptyProfile, firstName: 'Main' });
    const other = await createProfile('Other');
    await saveProfile({ ...emptyProfile, firstName: 'Late edit' }, 'main');
    expect((await loadProfile()).firstName).toBe('');
    await switchProfile('main');
    expect((await loadProfile()).firstName).toBe('Late edit');
    expect(other).not.toBe('main');
  });

  it('tells pages when another profile becomes active', async () => {
    await saveProfile({ ...emptyProfile, firstName: 'Main' });
    const seen: string[] = [];
    const stop = watchProfile((p, id) => seen.push(`${id === 'main' ? 'main' : 'other'}:${p.firstName}`));
    await new Promise((r) => setTimeout(r, 0));
    const other = await createProfile('Other', { ...emptyProfile, firstName: 'Copy' });
    await new Promise((r) => setTimeout(r, 0));
    await switchProfile('main');
    await new Promise((r) => setTimeout(r, 0));
    stop();
    expect(seen).toEqual(['other:Copy', 'main:Main']);
    expect(other).toBeTruthy();
  });

  it('"Delete all data" leaves one empty Main profile', async () => {
    await saveProfile({ ...emptyProfile, firstName: 'Max' });
    const other = await createProfile('Other', { ...emptyProfile, firstName: 'Copy' });
    await resetProfiles();
    expect(await loadIndex()).toEqual({ active: 'main', list: [{ id: 'main', name: '' }] });
    expect((await loadProfile()).firstName).toBe('');
    expect(await stored(`profile:${other}`)).toBeUndefined();
  });
});
