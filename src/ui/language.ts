import { browser } from 'wxt/browser';
import { browserLanguage, isLang, type Lang } from './i18n';

/** The interface language, kept apart from the profile: it is a setting, not something forms ask for. */
const KEY = 'uiLanguage';

/** The chosen interface language, or the browser's when none was chosen. */
export async function loadLanguage(): Promise<Lang> {
  const stored = await browser.storage.local.get(KEY);
  return isLang(stored[KEY]) ? stored[KEY] : browserLanguage();
}

export async function saveLanguage(lang: Lang): Promise<void> {
  await browser.storage.local.set({ [KEY]: lang });
}

/** Calls back when the language is changed, here or in another page. Returns a stop function. */
export function watchLanguage(onChange: (lang: Lang) => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    const next = changes[KEY]?.newValue;
    if (area === 'local' && isLang(next)) onChange(next);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
