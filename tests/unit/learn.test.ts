import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { companyKey, withPlaceholders } from '../../src/engine/job';
import { learnFrom, saveLearned } from '../../src/engine/learn';
import { nowhere, profile } from './helpers';

const job = { company: 'Acme GmbH', position: 'QA Engineer' };

/** Puts one labelled control on the page and types into it. */
function typed(label: string, text: string, control = '<textarea id="q"></textarea>'): HTMLElement {
  document.body.innerHTML = `<form><label for="q">${label}</label>${control}</form>`;
  const el = document.getElementById('q') as HTMLInputElement;
  el.value = text;
  return el;
}

describe('learning answers typed into the form', () => {
  it('offers what was typed into a question LocalApply had no answer for', () => {
    const el = typed('Why do you want to work here?', 'I like the product.');
    expect(learnFrom(el, profile)).toEqual({ label: 'Why do you want to work here?', answer: 'I like the product.' });
  });

  it('turns the employer and job title into placeholders, with or without the legal form', () => {
    const el = typed('Why us?', 'Acme is where I want to be a QA Engineer, and Acme GmbH knows why.');
    expect(learnFrom(el, profile, { job })?.answer).toBe(
      '{company} is where I want to be a {position}, and {company} knows why.',
    );
  });

  it('leaves profile fields, sensitive questions, empty boxes and non-text inputs alone', () => {
    expect(learnFrom(typed('First name', 'Maximilian', '<input id="q">'), profile)).toBeNull();
    expect(learnFrom(typed('IBAN for expenses', 'DE89 3704 0044 0532 0130 00', '<input id="q">'), profile)).toBeNull();
    expect(learnFrom(typed('Password', 'secret', '<input id="q" type="text">'), profile)).toBeNull();
    expect(learnFrom(typed('Anything else?', '   '), profile)).toBeNull();
    expect(learnFrom(typed('How many hours?', '40', '<input id="q" type="number">'), profile)).toBeNull();
    expect(learnFrom(typed('Code', '123456', '<input id="q" autocomplete="one-time-code">'), profile)).toBeNull();
  });

  it('skips text the profile already holds', () => {
    expect(learnFrom(typed('Contact us at', 'max@example.com', '<input id="q">'), profile)).toBeNull();
  });

  it('offers a changed answer to a saved question as a replacement, and nothing when it is unchanged', () => {
    expect(learnFrom(typed('How did you hear about us?', 'LinkedIn'), profile)).toBeNull();
    expect(learnFrom(typed('How did you hear about us?', 'A friend'), profile)).toEqual({
      label: 'How did you hear about us?',
      answer: 'A friend',
      replaces: '1',
    });
  });

  it('does not offer back an answer LocalApply filled with its placeholders replaced', async () => {
    const withLetter = {
      ...profile,
      customAnswers: [{ id: '2', keywords: 'why us', answer: 'I want to join {company}.' }],
    };
    const el = typed('Why us?', '');
    await fillPage(document, withLetter, { location: nowhere, job });
    expect((el as HTMLTextAreaElement).value).toBe('I want to join Acme GmbH.');
    expect(learnFrom(el, withLetter, { job })).toBeNull();
  });

  it('saves new answers with the question as keywords and replaces changed ones', () => {
    const saved = saveLearned(profile, [
      { label: 'Why us, really?', answer: 'Because.' },
      { label: 'How did you hear about us?', answer: 'A friend', replaces: '1' },
    ]);
    expect(saved.customAnswers.map((a) => [a.keywords, a.answer])).toEqual([
      ['hear about us', 'A friend'],
      ['Why us  really?', 'Because.'],
    ]);
    expect(profile.customAnswers[0].answer).toBe('LinkedIn');
  });
});

describe('placeholders and company names', () => {
  it('replaces whole words only', () => {
    expect(withPlaceholders('Acmeville loves Acme.', { company: 'Acme' })).toBe('Acmeville loves {company}.');
  });

  it('ignores names of one letter and missing values', () => {
    expect(withPlaceholders('X marks the spot', { company: 'X' })).toBe('X marks the spot');
    expect(withPlaceholders('Nothing to do', undefined)).toBe('Nothing to do');
  });

  it('compares employers without legal form, case or punctuation', () => {
    expect(companyKey('ACME GmbH')).toBe('acme');
    expect(companyKey('Acme.')).toBe('acme');
    expect(companyKey('Northwind Labs Inc.')).toBe('northwind labs');
    expect(companyKey('Kowalski Sp. z o.o.')).toBe('kowalski');
  });
});
