import { beforeEach, describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { profile, PHONE, nowhere, load, value, named } from './helpers';

describe('generic English form', () => {
  beforeEach(() => load('generic-en.html'));

  it('fills the standard fields', async () => {
    await fillPage(document, profile, { location: nowhere });
    expect(value('fn')).toBe('Max');
    expect(value('ln')).toBe('Muster');
    expect(named('applicant_email').value).toBe('max@example.com');
    expect(named('p1').value).toBe(PHONE);
    expect(named('a1').value).toBe('Hauptstr. 5');
    expect(value('zip')).toBe('10115');
    expect(value('city')).toBe('Berlin');
    expect(value('country')).toBe('DE');
    expect(value('li')).toBe(profile.linkedin);
    expect(value('gh')).toBe(profile.github);
    expect(value('pf')).toBe(profile.website);
    expect(value('sal')).toBe('65000');
    expect(value('np')).toBe('3 months');
    expect(value('sd')).toBe('01/01/2027');
    expect(value('dob')).toBe('1990-04-15');
    expect(value('cl')).toBe('Dear hiring team');
  });

  it('answers yes/no radio questions', async () => {
    await fillPage(document, profile, { location: nowhere });
    expect((document.querySelector('[name="auth"][value="1"]') as HTMLInputElement).checked).toBe(true);
    expect((document.querySelector('[name="spons"][value="0"]') as HTMLInputElement).checked).toBe(true);
  });

  it('uses custom answers and reports what it could not fill', async () => {
    const result = await fillPage(document, profile, { location: nowhere });
    expect(value('hear')).toBe('LinkedIn');
    expect(value('why')).toBe('');
    expect(value('ref')).toBe('');
    const open = result.unmatched.map((u) => u.label);
    expect(open).toContain('Why do you want to work here?');
    expect(open).toContain('Reference name');
    expect(result.unmatched.find((u) => u.label.includes('privacy'))?.required).toBe(true);
  });

  it('leaves existing values, hidden, password and search inputs alone', async () => {
    const result = await fillPage(document, profile, { location: nowhere });
    expect(value('mid')).toBe('Kept');
    expect(result.skipped).toBe(1);
    expect(named('token').value).toBe('abc');
    expect(named('pw').value).toBe('');
    expect(named('q').value).toBe('');
    expect((document.querySelector('[name="privacy"]') as HTMLInputElement).checked).toBe(false);
  });

  it('overwrites only when asked', async () => {
    (document.getElementById('fn') as HTMLInputElement).value = 'Old';
    await fillPage(document, profile, { location: nowhere });
    expect(value('fn')).toBe('Old');
    await fillPage(document, profile, { location: nowhere, overwrite: true });
    expect(value('fn')).toBe('Max');
  });

  it('reports recognised fields that the profile has no value for', async () => {
    const result = await fillPage(document, { ...profile, noticePeriod: '' }, { location: nowhere });
    expect(result.missing).toContainEqual({ label: 'Notice period', key: 'noticePeriod' });
  });

  it('outlines the radio option that was chosen', async () => {
    await fillPage(document, profile, { location: nowhere });
    const marked = (selector: string) => document.querySelector(selector)!.parentElement!.hasAttribute('data-jaf-mark');
    expect(marked('[name="spons"][value="0"]')).toBe(true);
    expect(marked('[name="spons"][value="1"]')).toBe(false);
  });

  it('marks filled fields and clears marks on the next run', async () => {
    await fillPage(document, profile, { location: nowhere });
    expect(document.getElementById('fn')!.getAttribute('data-jaf-mark')).toBe('filled');
    await fillPage(document, profile, { location: nowhere });
    expect(document.getElementById('fn')!.hasAttribute('data-jaf-mark')).toBe(false);
  });
});

describe('generic German form', () => {
  beforeEach(() => load('generic-de.html'));

  it('fills fields, split phone and split address', async () => {
    const result = await fillPage(document, profile, { location: nowhere });
    expect(value('anrede')).toBe('m');
    expect(value('a')).toBe('Max');
    expect(value('b')).toBe('Muster');
    expect(value('c')).toBe('max@example.com');
    expect(value('v')).toBe('DE');
    expect(value('d')).toBe('151 2345678');
    expect(value('e')).toBe('Hauptstr.');
    expect(value('f')).toBe('5');
    expect(value('g')).toBe('10115');
    expect(value('h')).toBe('Berlin');
    expect(value('i')).toBe('Deutschland');
    expect(value('j')).toBe('15.04.1990');
    expect(value('k')).toBe('65000 EUR');
    expect(value('l')).toBe('3 months');
    expect(value('m')).toBe('01.01.2027');
    expect(value('n')).toBe('German');
    expect(value('o')).toBe(profile.xing);
    expect(value('q')).toBe('Dear hiring team');
    expect(result.missing).toContainEqual({ label: 'Lebenslauf', key: 'cv' });
  });
});

describe('other languages', () => {
  beforeEach(() => load('multilingual.html'));

  it('recognises French, Spanish, Italian, Dutch, Portuguese and Polish labels', async () => {
    await fillPage(document, profile, { location: nowhere });
    const expected: Record<string, string> = {
      fr1: 'Max',
      fr2: 'Muster',
      fr3: 'max@example.com',
      fr4: PHONE,
      fr5: '10115',
      fr6: 'Berlin',
      fr7: 'Germany',
      fr8: '65000 EUR',
      fr9: '15/04/1990',
      fr10: 'Acme GmbH',
      es1: 'Max',
      es2: 'Muster',
      es3: 'max@example.com',
      es4: PHONE,
      es5: 'Hauptstr. 5',
      es6: 'Berlin',
      es7: '65000 EUR',
      es8: 'Max Muster',
      it1: 'Max',
      it2: 'Muster',
      it3: 'Hauptstr. 5',
      it4: 'Berlin',
      it5: '10115',
      it6: PHONE,
      nl1: 'Max',
      nl2: 'Muster',
      nl3: 'max@example.com',
      nl4: PHONE,
      nl5: 'Berlin',
      nl6: '3 months',
      pt1: 'Max',
      pt2: 'Muster',
      pt3: 'Hauptstr. 5',
      pt4: 'Berlin',
      pt5: '65000 EUR',
      pl1: 'Max',
      pl2: 'Muster',
      pl3: 'max@example.com',
      pl4: PHONE,
      pl5: 'Berlin',
      pl6: '10115',
      pl7: '65000 EUR',
    };
    const actual = Object.fromEntries(Object.keys(expected).map((id) => [id, value(id)]));
    expect(actual).toEqual(expected);
  });
});
