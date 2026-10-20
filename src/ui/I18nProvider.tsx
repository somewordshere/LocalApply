import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translator, type Lang, type Translate } from './i18n';
import { loadLanguage, saveLanguage, watchLanguage } from './language';

interface I18n {
  lang: Lang;
  t: Translate;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18n | null>(null);

/** Loads the interface language and keeps every page that shows this provider on the same one. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);

  useEffect(() => {
    loadLanguage().then(setLangState);
    return watchLanguage(setLangState);
  }, []);

  useEffect(() => {
    if (lang) document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n | null>(
    () =>
      lang && {
        lang,
        t: translator(lang),
        setLang: (next) => {
          setLangState(next);
          void saveLanguage(next);
        },
      },
    [lang],
  );

  // Rendering only once the language is known avoids a flash of English text.
  return value ? <I18nContext.Provider value={value}>{children}</I18nContext.Provider> : null;
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('useI18n needs an I18nProvider above it');
  return i18n;
}
