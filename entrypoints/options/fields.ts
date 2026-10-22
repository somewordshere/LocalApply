import type { MessageKey } from '@/src/ui/i18n';
import type { Profile } from '@/src/profile/schema';

/** Profile properties that hold a single string, i.e. the ones a plain input can edit. */
export type TextKey = {
  [K in keyof Profile]: Profile[K] extends string ? K : never;
}[keyof Profile];

/** Brand names read the same in every language, so they are not translated. */
type Brand = 'LinkedIn' | 'GitHub' | 'Xing';

export interface FieldDef {
  key: TextKey;
  label: MessageKey | Brand;
  type?: 'text' | 'email' | 'tel' | 'url' | 'date';
  /** Renders a dropdown of [value, label] pairs instead of a text input. Values are stored as they are. */
  options?: [value: string, label: MessageKey][];
  /** Example text in the empty box, translated. */
  placeholder?: MessageKey;
  /** Example text that reads the same in every language (URLs, numbers, currency codes). */
  example?: string;
  /** Spans both columns. */
  wide?: boolean;
  /** The phone number, with its choice of one box or two (see PhoneField). */
  phone?: boolean;
}

export interface FieldSectionDef {
  id: string;
  title: MessageKey;
  /** Shorter name for the section links, when the title is long. */
  navTitle?: MessageKey;
  note?: MessageKey;
  fields: FieldDef[];
}

const YES_NO: [string, MessageKey][] = [
  ['', 'notSet'],
  ['yes', 'yes'],
  ['no', 'no'],
];

/**
 * The simple fields of the profile page, grouped into cards. A new string field in the
 * profile schema needs an entry here, and its label in src/ui/i18n, to become editable.
 */
export const FIELD_SECTIONS: FieldSectionDef[] = [
  {
    id: 'personal',
    title: 'section.personal',
    fields: [
      {
        key: 'salutation',
        label: 'field.salutation',
        options: [
          ['', 'notSet'],
          ['Mr', 'field.salutation.mr'],
          ['Ms', 'field.salutation.ms'],
          ['Mx', 'field.salutation.mx'],
        ],
      },
      { key: 'firstName', label: 'field.firstName' },
      { key: 'lastName', label: 'field.lastName' },
      { key: 'email', label: 'field.email', type: 'email' },
      { key: 'phoneNumber', label: 'phone.label', phone: true, wide: true },
      { key: 'dateOfBirth', label: 'field.dateOfBirth', type: 'date' },
      { key: 'nationality', label: 'field.nationality' },
    ],
  },
  {
    id: 'address',
    title: 'section.address',
    fields: [
      { key: 'street', label: 'field.street' },
      { key: 'houseNumber', label: 'field.houseNumber' },
      { key: 'postcode', label: 'field.postcode' },
      { key: 'city', label: 'field.city' },
      { key: 'state', label: 'field.state' },
      { key: 'country', label: 'field.country', placeholder: 'field.country.placeholder' },
    ],
  },
  {
    id: 'links',
    title: 'section.links',
    fields: [
      { key: 'linkedin', label: 'LinkedIn', type: 'url', example: 'https://www.linkedin.com/in/…' },
      { key: 'github', label: 'GitHub', type: 'url', example: 'https://github.com/…' },
      { key: 'website', label: 'field.website', type: 'url' },
      { key: 'xing', label: 'Xing', type: 'url' },
    ],
  },
  {
    id: 'job',
    title: 'section.job',
    navTitle: 'section.job.nav',
    fields: [
      { key: 'salaryAmount', label: 'field.salaryAmount', example: '65000' },
      { key: 'salaryCurrency', label: 'field.salaryCurrency', example: 'EUR' },
      { key: 'noticePeriod', label: 'field.noticePeriod', placeholder: 'field.noticePeriod.placeholder' },
      { key: 'startDate', label: 'field.startDate', type: 'date' },
      { key: 'yearsOfExperience', label: 'field.yearsOfExperience', example: '5' },
      { key: 'workAuthorized', label: 'field.workAuthorized', options: YES_NO },
      { key: 'needsSponsorship', label: 'field.needsSponsorship', options: YES_NO },
      { key: 'willingToRelocate', label: 'field.willingToRelocate', options: YES_NO },
      { key: 'remotePreference', label: 'field.remotePreference', placeholder: 'field.remotePreference.placeholder' },
    ],
  },
  {
    id: 'background',
    title: 'section.background',
    fields: [
      { key: 'currentTitle', label: 'field.currentTitle' },
      { key: 'currentEmployer', label: 'field.currentEmployer' },
      { key: 'school', label: 'field.school' },
      {
        key: 'educationLevel',
        label: 'field.educationLevel',
        options: [
          ['', 'notSet'],
          ['High school', 'field.educationLevel.highSchool'],
          ['Vocational training', 'field.educationLevel.vocational'],
          ['Associate degree', 'field.educationLevel.associate'],
          ["Bachelor's degree", 'field.educationLevel.bachelor'],
          ["Master's degree", 'field.educationLevel.master'],
          ['MBA', 'field.educationLevel.mba'],
          ['PhD', 'field.educationLevel.doctorate'],
          ['Other', 'field.educationLevel.other'],
        ],
      },
      { key: 'degree', label: 'field.degree' },
      { key: 'fieldOfStudy', label: 'field.fieldOfStudy' },
    ],
  },
  {
    id: 'voluntary',
    title: 'section.voluntary',
    navTitle: 'section.voluntary.nav',
    note: 'section.voluntary.note',
    fields: [
      {
        key: 'gender',
        label: 'field.gender',
        options: [
          ['', 'notSet'],
          ['Male', 'field.gender.male'],
          ['Female', 'field.gender.female'],
          ['Non-binary', 'field.gender.nonBinary'],
          ['Prefer not to say', 'field.gender.preferNot'],
        ],
      },
      { key: 'disability', label: 'field.disability', options: YES_NO },
      { key: 'veteran', label: 'field.veteran', options: YES_NO },
    ],
  },
];
