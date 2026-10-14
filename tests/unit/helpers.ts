import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { emptyProfile, type Profile } from '../../src/profile/schema';

/** A complete test profile; individual tests override fields with spread. */
export const profile: Profile = {
  ...emptyProfile,
  salutation: 'Mr',
  firstName: 'Max',
  lastName: 'Muster',
  email: 'max@example.com',
  phoneCountryCode: '+49',
  phoneNumber: '151 2345678',
  dateOfBirth: '1990-04-15',
  nationality: 'German',
  street: 'Hauptstr.',
  houseNumber: '5',
  postcode: '10115',
  city: 'Berlin',
  country: 'Germany',
  linkedin: 'https://www.linkedin.com/in/max',
  github: 'https://github.com/max',
  website: 'https://max.example.com',
  xing: 'https://www.xing.com/profile/max',
  salaryAmount: '65000',
  salaryCurrency: 'EUR',
  noticePeriod: '3 months',
  startDate: '2027-01-01',
  workAuthorized: 'yes',
  needsSponsorship: 'no',
  currentEmployer: 'Acme GmbH',
  coverLetterText: 'Dear hiring team',
  customAnswers: [{ id: '1', keywords: 'hear about us', answer: 'LinkedIn' }],
};

export const PHONE = '+49 151 2345678';
export const nowhere = { hostname: 'example.com', pathname: '/' };

/** Replaces the test document with a fixture from tests/fixtures. */
export function load(name: string): void {
  const html = readFileSync(resolvePath(__dirname, '../fixtures', name), 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.documentElement.lang = parsed.documentElement.lang;
  document.body.innerHTML = parsed.body.innerHTML;
}

export function value(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

export function named(name: string, form?: string): HTMLInputElement {
  return document.querySelector(`${form ? `#${form} ` : ''}[name="${name}"]`) as HTMLInputElement;
}

/** Keeps one form of a multi-form fixture. */
export function only(formId: string): void {
  for (const form of document.querySelectorAll('form')) if (form.id !== formId) form.remove();
}
