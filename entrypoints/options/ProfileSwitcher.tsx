import { useEffect, useState } from 'react';
import type { Profile } from '@/src/profile/schema';
import {
  createProfile,
  deleteProfile,
  loadIndex,
  renameProfile,
  switchProfile,
  watchIndex,
  type ProfileIndex,
} from '@/src/profile/store';
import { useI18n } from '@/src/ui/I18nProvider';

/** Profiles for different kinds of application (a German CV, a QA role): choose, add, rename, delete. */
export function ProfileSwitcher({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [index, setIndex] = useState<ProfileIndex | null>(null);
  const [mode, setMode] = useState<'idle' | 'new' | 'rename'>('idle');
  const [name, setName] = useState('');
  const [copy, setCopy] = useState(true);

  useEffect(() => {
    void loadIndex().then(setIndex);
    return watchIndex(setIndex);
  }, []);
  if (!index) return null;

  const nameOf = (ref: ProfileIndex['list'][number]) => ref.name || t('profiles.main');
  const active = index.list.find((p) => p.id === index.active)!;
  const done = () => {
    setMode('idle');
    setName('');
  };
  const submit = async () => {
    if (!name.trim()) return;
    if (mode === 'new') await createProfile(name, copy ? profile : undefined);
    if (mode === 'rename') await renameProfile(active.id, name);
    done();
  };

  if (mode !== 'idle') {
    return (
      <form
        className="mt-5 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          className="field w-64 py-1.5"
          autoFocus
          aria-label={t('profiles.name')}
          placeholder={t('profiles.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {mode === 'new' && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="size-4 accent-accent"
              checked={copy}
              onChange={(e) => setCopy(e.target.checked)}
            />
            {t('profiles.copy')}
          </label>
        )}
        <button className="btn py-1.5" type="submit" disabled={!name.trim()}>
          {mode === 'new' ? t('profiles.create') : t('save')}
        </button>
        <button className="btn-quiet" type="button" onClick={done}>
          {t('cancel')}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
      <label className="flex items-center gap-2">
        <span aria-hidden="true">{t('profiles.label')}</span>
        <select
          className="field w-auto py-1.5"
          aria-label={t('profiles.label')}
          value={index.active}
          onChange={(e) => void switchProfile(e.target.value)}
        >
          {index.list.map((ref) => (
            <option key={ref.id} value={ref.id}>
              {nameOf(ref)}
            </option>
          ))}
        </select>
      </label>
      <button className="btn-quiet" onClick={() => setMode('new')}>
        {t('profiles.new')}
      </button>
      <button
        className="btn-quiet"
        onClick={() => {
          setName(active.name);
          setMode('rename');
        }}
      >
        {t('profiles.rename')}
      </button>
      {index.list.length > 1 && (
        <button
          className="cursor-pointer px-1 text-sm font-medium text-danger underline-offset-3 hover:underline"
          onClick={() => {
            if (confirm(t('profiles.confirmDelete', { name: nameOf(active) }))) void deleteProfile(active.id);
          }}
        >
          {t('profiles.delete')}
        </button>
      )}
    </div>
  );
}
