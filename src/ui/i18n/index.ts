import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { it } from './it';
import { nl } from './nl';
import { pl } from './pl';
import { pt } from './pt';
import type { Message, Plural } from './types';

export type MessageKey = keyof typeof en;
/** A full translation: every key of the English base, nothing more (the compiler checks both). */
export type Translation = Record<MessageKey, Message>;

/** The interface languages, the same eight the form engine recognises, each named in itself. */
export const LANGUAGES = [
  ['en', 'English'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['es', 'Español'],
  ['it', 'Italiano'],
  ['nl', 'Nederlands'],
  ['pt', 'Português'],
  ['pl', 'Polski'],
] as const;

export type Lang = (typeof LANGUAGES)[number][0];

export const TRANSLATIONS: Record<Lang, Translation> = { en, de, fr, es, it, nl, pt, pl };

export function isLang(value: unknown): value is Lang {
  return LANGUAGES.some(([code]) => code === value);
}

/** The interface language matching the browser's, or English. */
export function browserLanguage(preferred: readonly string[] = globalThis.navigator?.languages ?? []): Lang {
  for (const tag of preferred) {
    const code = tag.toLowerCase().split('-')[0];
    if (isLang(code)) return code;
  }
  return 'en';
}

export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

/** Looks up messages in one language; `vars.n` picks the plural form of counted messages. */
export function translator(lang: Lang): Translate {
  const messages = TRANSLATIONS[lang];
  const plurals = new Intl.PluralRules(lang);
  return (key, vars = {}) => {
    const message = messages[key] ?? en[key];
    const text =
      typeof message === 'string'
        ? message
        : ((message as Plural)[plurals.select(Number(vars.n ?? 0))] ?? message.other);
    return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
  };
}
