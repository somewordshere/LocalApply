import { describe, expect, it } from 'vitest';
import { browserLanguage, LANGUAGES, translator, TRANSLATIONS, type MessageKey } from '../../src/ui/i18n';
import { en } from '../../src/ui/i18n/en';
import type { Message } from '../../src/ui/i18n/types';

const blanks = (message: Message) =>
  [
    ...new Set((typeof message === 'string' ? [message] : Object.values(message)).join(' ').match(/\{\w+\}/g) ?? []),
  ].sort();

describe('interface translations', () => {
  it('offer the eight languages the form engine recognises', () => {
    expect(LANGUAGES.map(([code]) => code)).toEqual(['en', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'pl']);
  });

  it('keep every blank ({n}, {label}, …) of the English text', () => {
    for (const [lang, messages] of Object.entries(TRANSLATIONS)) {
      for (const key of Object.keys(en) as MessageKey[]) {
        expect(blanks(messages[key]), `${lang} ${key}`).toEqual(blanks(en[key]));
      }
    }
  });

  it('leave no message empty', () => {
    for (const [lang, messages] of Object.entries(TRANSLATIONS)) {
      for (const [key, message] of Object.entries(messages)) {
        const forms = typeof message === 'string' ? [message] : Object.values(message);
        expect(
          forms.every((form) => form.trim() !== ''),
          `${lang} ${key}`,
        ).toBe(true);
      }
    }
  });

  it('pick the plural form the language needs', () => {
    const en = translator('en');
    expect(en('notice.filled', { n: 1 })).toBe('Filled 1 field');
    expect(en('notice.filled', { n: 3 })).toBe('Filled 3 fields');
    const pl = translator('pl');
    expect(pl('notice.filled', { n: 1 })).toBe('Wypełniono 1 pole');
    expect(pl('notice.filled', { n: 3 })).toBe('Wypełniono 3 pola');
    expect(pl('notice.filled', { n: 5 })).toBe('Wypełniono 5 pól');
    expect(pl('notice.filled', { n: 22 })).toBe('Wypełniono 22 pola');
  });

  it('fill in the blanks', () => {
    expect(translator('de')('section.count', { filled: 4, total: 7 })).toBe('4 von 7');
  });

  it("start in the browser's language, or English", () => {
    expect(browserLanguage(['pl-PL', 'en'])).toBe('pl');
    expect(browserLanguage(['ja-JP', 'de-AT'])).toBe('de');
    expect(browserLanguage(['ja-JP'])).toBe('en');
    expect(browserLanguage([])).toBe('en');
  });
});
