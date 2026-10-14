export type FieldKind =
  'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'checkgroup' | 'file' | 'date' | 'combobox';

export type FieldKey =
  | 'salutation'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'phoneCountryCode'
  | 'dateOfBirth'
  | 'nationality'
  | 'street'
  | 'houseNumber'
  | 'postcode'
  | 'city'
  | 'state'
  | 'country'
  | 'location'
  | 'linkedin'
  | 'github'
  | 'website'
  | 'xing'
  | 'salary'
  | 'salaryCurrency'
  | 'noticePeriod'
  | 'startDate'
  | 'workAuthorized'
  | 'needsSponsorship'
  | 'willingToRelocate'
  | 'remotePreference'
  | 'yearsOfExperience'
  | 'currentTitle'
  | 'currentEmployer'
  | 'school'
  | 'degree'
  | 'fieldOfStudy'
  | 'coverLetterText'
  | 'cv'
  | 'coverLetterFile'
  | 'gender'
  | 'disability'
  | 'veteran';

export interface FieldOption {
  text: string;
  value: string;
  el: HTMLElement;
}

export interface Field {
  /** The control itself; for a radio group, its first radio. */
  el: HTMLElement;
  kind: FieldKind;
  /** Input type attribute, lowercased ('' for non-inputs). */
  type: string;
  label: string;
  /** name, id and test/automation ids, raw. */
  attrs: string[];
  autocomplete: string[];
  placeholder: string;
  required: boolean;
  /** Options of a select or radio group. */
  options: FieldOption[];
}

export interface FillResult {
  adapter: string | null;
  /** Fields found on the page. */
  total: number;
  filled: { label: string; key: string }[];
  /** Recognised fields whose value is empty in the profile. */
  missing: { label: string; key: string }[];
  /** Fields that could not be mapped or set. */
  unmatched: { label: string; required: boolean }[];
  /** Fields left alone because they already had a value. */
  skipped: number;
}
