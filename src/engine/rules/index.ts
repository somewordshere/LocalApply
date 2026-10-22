import { phrases } from '../text';
import type { FieldKey } from '../types';
import { FIELD_RULES } from './fields';
import { LOCALES } from './locales';
import type { Locale, Rule } from './types';

export { DATE_KEYS, MONTH_KEYS, YES_NO_KEYS } from './fields';
export type { FieldRule, Locale, Rule } from './types';

function gather(part: 'fields' | 'exact' | 'exclude', key: FieldKey): string[] {
  return [...new Set(LOCALES.flatMap((locale: Locale) => locale[part]?.[key] ?? []))];
}

/** Labels containing these belong to someone other than the applicant. */
export const NOT_THE_APPLICANT = phrases([...new Set(LOCALES.flatMap((locale) => locale.otherPerson ?? []))]);

/** The field rules with every language's phrases merged in, in priority order. */
export const RULES: Rule[] = FIELD_RULES.map((field) => {
  const words = gather('fields', field.key);
  if (!words.length) throw new Error(`No phrases for field "${field.key}" in any locale`);
  const exact = gather('exact', field.key);
  const exclude = gather('exclude', field.key);
  return {
    ...field,
    re: phrases(words),
    exact: exact.length ? exact : undefined,
    not: exclude.length ? phrases(exclude) : undefined,
  };
});
