import type { Profile } from '@/src/profile/schema';

/** Profile properties that hold a single string, i.e. the ones a plain input can edit. */
export type TextKey = {
  [K in keyof Profile]: Profile[K] extends string ? K : never;
}[keyof Profile];

export interface FieldDef {
  key: TextKey;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'date';
  /** Renders a dropdown of [value, label] pairs instead of a text input. */
  options?: [value: string, label: string][];
  placeholder?: string;
  /** Spans both columns. */
  wide?: boolean;
  /** The phone number, with its choice of one box or two (see PhoneField). */
  phone?: boolean;
}

export interface FieldSectionDef {
  id: string;
  title: string;
  /** Shorter name for the section links, when the title is long. */
  navTitle?: string;
  note?: string;
  fields: FieldDef[];
}

const YES_NO: [string, string][] = [
  ['', 'Not set'],
  ['yes', 'Yes'],
  ['no', 'No'],
];

/**
 * The simple fields of the profile page, grouped into cards. A new string field in the
 * profile schema only needs an entry here to become editable.
 */
export const FIELD_SECTIONS: FieldSectionDef[] = [
  {
    id: 'personal',
    title: 'Personal',
    fields: [
      {
        key: 'salutation',
        label: 'Salutation',
        options: [
          ['', 'Not set'],
          ['Mr', 'Mr'],
          ['Ms', 'Ms'],
          ['Mx', 'Mx'],
        ],
      },
      { key: 'firstName', label: 'First name' },
      { key: 'lastName', label: 'Last name' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phoneNumber', label: 'Phone', phone: true, wide: true },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
      { key: 'nationality', label: 'Nationality' },
    ],
  },
  {
    id: 'address',
    title: 'Address',
    fields: [
      { key: 'street', label: 'Street' },
      { key: 'houseNumber', label: 'House number' },
      { key: 'postcode', label: 'Postcode' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State / region' },
      { key: 'country', label: 'Country', placeholder: 'Germany' },
    ],
  },
  {
    id: 'links',
    title: 'Links',
    fields: [
      { key: 'linkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://www.linkedin.com/in/…' },
      { key: 'github', label: 'GitHub', type: 'url', placeholder: 'https://github.com/…' },
      { key: 'website', label: 'Portfolio / website', type: 'url' },
      { key: 'xing', label: 'Xing', type: 'url' },
    ],
  },
  {
    id: 'job',
    title: 'Job preferences',
    navTitle: 'Job',
    fields: [
      { key: 'salaryAmount', label: 'Salary expectation', placeholder: '65000' },
      { key: 'salaryCurrency', label: 'Currency', placeholder: 'EUR' },
      { key: 'noticePeriod', label: 'Notice period', placeholder: '3 months' },
      { key: 'startDate', label: 'Earliest start date', type: 'date' },
      { key: 'yearsOfExperience', label: 'Years of experience', placeholder: '5' },
      { key: 'workAuthorized', label: 'Authorised to work', options: YES_NO },
      { key: 'needsSponsorship', label: 'Needs visa sponsorship', options: YES_NO },
      { key: 'willingToRelocate', label: 'Willing to relocate', options: YES_NO },
      { key: 'remotePreference', label: 'Work model', placeholder: 'Hybrid' },
    ],
  },
  {
    id: 'background',
    title: 'Background',
    fields: [
      { key: 'currentTitle', label: 'Current job title' },
      { key: 'currentEmployer', label: 'Current employer' },
      { key: 'school', label: 'University / school' },
      { key: 'degree', label: 'Degree' },
      { key: 'fieldOfStudy', label: 'Field of study' },
    ],
  },
  {
    id: 'voluntary',
    title: 'Voluntary disclosures',
    navTitle: 'Voluntary',
    note: 'Left blank unless you set them. Only used when a form asks.',
    fields: [
      {
        key: 'gender',
        label: 'Gender',
        options: [
          ['', 'Not set'],
          ['Male', 'Male'],
          ['Female', 'Female'],
          ['Non-binary', 'Non-binary'],
          ['Prefer not to say', 'Prefer not to say'],
        ],
      },
      { key: 'disability', label: 'Disability', options: YES_NO },
      { key: 'veteran', label: 'Veteran', options: YES_NO },
    ],
  },
];
