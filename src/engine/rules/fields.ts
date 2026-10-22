import type { FieldKey } from '../types';
import type { FieldRule } from './types';

/**
 * Every field the engine can recognise, in priority order: on an equal score the earlier
 * entry wins, so specific fields come before general ones. Phrases live in ./locales.
 */
export const FIELD_RULES: FieldRule[] = [
  { key: 'coverLetterFile', file: true },
  { key: 'cv', file: true },

  { key: 'workAuthorized', long: true },
  { key: 'needsSponsorship', long: true },
  { key: 'willingToRelocate', long: true },
  { key: 'salaryCurrency' },
  { key: 'salary', long: true },
  { key: 'noticePeriod', long: true },
  { key: 'startDate', long: true },
  { key: 'yearsOfExperience', long: true },
  { key: 'remotePreference', long: true },
  { key: 'disability', long: true },
  { key: 'veteran', long: true },
  // Before gender, whose "sex" must not take "sexual orientation" questions.
  { key: 'sexualOrientation', long: true },
  { key: 'gender', long: true, auto: ['sex'] },
  { key: 'salutation', auto: ['honorific-prefix'] },
  { key: 'coverLetterText', kinds: ['textarea'], long: true },

  { key: 'linkedin' },
  { key: 'xing' },
  // Before GitHub so a combined "Website / Portfolio / GitHub" field gets the portfolio link.
  { key: 'website' },
  { key: 'github' },

  { key: 'fullName', auto: ['name'] },
  { key: 'firstName', auto: ['given-name'] },
  { key: 'lastName', auto: ['family-name'] },
  { key: 'email', auto: ['email'], types: ['email'] },
  { key: 'phoneCountryCode', auto: ['tel-country-code'] },
  { key: 'phone', auto: ['tel', 'tel-national'], types: ['tel'] },
  { key: 'dateOfBirth', auto: ['bday'] },
  { key: 'nationality' },
  { key: 'houseNumber' },
  { key: 'postcode', auto: ['postal-code'] },
  { key: 'city', auto: ['address-level2'] },
  { key: 'state', auto: ['address-level1'] },
  { key: 'country', auto: ['country', 'country-name'] },
  { key: 'street', auto: ['street-address', 'address-line1'] },
  { key: 'location', long: true },

  { key: 'currentTitle', auto: ['organization-title'] },
  // Never a text area: those hold questions about the company, not its name.
  { key: 'currentEmployer', auto: ['organization'], kinds: ['text', 'select', 'combobox'] },
  // Before school and degree: "Highest degree", "Level of schooling" ask for the level.
  { key: 'educationLevel', long: true, kinds: ['text', 'select', 'radio', 'combobox'] },
  { key: 'school' },
  { key: 'fieldOfStudy' },
  { key: 'degree' },
];

/** Questions answered by picking Yes or No from offered choices. */
export const YES_NO_KEYS = new Set<FieldKey>([
  'workAuthorized',
  'needsSponsorship',
  'willingToRelocate',
  'disability',
  'veteran',
]);

/** Stored as yyyy-mm-dd and reformatted for each form. */
export const DATE_KEYS = new Set<FieldKey>(['dateOfBirth', 'startDate']);
