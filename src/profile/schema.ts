import { PROFILE_VERSION, upgrade } from './migrations';

export interface StoredFile {
  name: string;
  type: string;
  dataUrl: string;
}

export type YesNo = '' | 'yes' | 'no';

/** Common European Framework levels, best first, plus native speaker. */
export const LANGUAGE_LEVELS = ['native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number] | '';

export interface SpokenLanguage {
  id: string;
  /** As the person writes it: "German", "Deutsch". */
  language: string;
  level: LanguageLevel;
}

export interface CustomAnswer {
  id: string;
  /** Comma-separated phrases; the answer is used when a field label contains one of them. */
  keywords: string;
  answer: string;
}

/**
 * Keywords for an answer saved against one question. Keywords are comma-separated,
 * so a comma inside the question would split it into loose fragments ("when").
 */
export function questionKeywords(label: string): string {
  return label.replace(/,/g, ' ');
}

export interface Profile {
  /** Schema version; see ./migrations.ts. */
  version: number;

  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;

  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  state: string;
  country: string;

  linkedin: string;
  github: string;
  website: string;
  xing: string;

  salaryAmount: string;
  /** Ends of a salary range; empty means the same as salaryAmount. */
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: 'year' | 'month';
  noticePeriod: string;
  startDate: string;
  workAuthorized: YesNo;
  needsSponsorship: YesNo;
  willingToRelocate: YesNo;
  willingToTravel: YesNo;
  drivingLicence: YesNo;
  /** Licence classes as written on the licence, such as "B" or "B, BE". */
  drivingLicenceClass: string;
  remotePreference: string;
  yearsOfExperience: string;

  currentTitle: string;
  currentEmployer: string;
  school: string;
  /** Stored in English ("Bachelor's degree"); see EDUCATION_LEVELS in src/engine/resolve.ts. */
  educationLevel: string;
  degree: string;
  fieldOfStudy: string;
  languages: SpokenLanguage[];

  coverLetterText: string;
  cv: StoredFile | null;
  coverLetterFile: StoredFile | null;

  customAnswers: CustomAnswer[];

  gender: string;
  sexualOrientation: string;
  disability: YesNo;
  veteran: YesNo;
}

export const emptyProfile: Profile = {
  version: PROFILE_VERSION,
  salutation: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneCountryCode: '',
  phoneNumber: '',
  dateOfBirth: '',
  nationality: '',
  street: '',
  houseNumber: '',
  postcode: '',
  city: '',
  state: '',
  country: '',
  linkedin: '',
  github: '',
  website: '',
  xing: '',
  salaryAmount: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'EUR',
  salaryPeriod: 'year',
  noticePeriod: '',
  startDate: '',
  workAuthorized: '',
  needsSponsorship: '',
  willingToRelocate: '',
  willingToTravel: '',
  drivingLicence: '',
  drivingLicenceClass: '',
  remotePreference: '',
  yearsOfExperience: '',
  currentTitle: '',
  currentEmployer: '',
  school: '',
  educationLevel: '',
  degree: '',
  fieldOfStudy: '',
  languages: [],
  coverLetterText: '',
  cv: null,
  coverLetterFile: null,
  customAnswers: [],
  gender: '',
  sexualOrientation: '',
  disability: '',
  veteran: '',
};

/**
 * Accepts anything read from storage or an imported file and returns a complete profile:
 * older versions are upgraded, missing fields get defaults, malformed parts are dropped.
 */
export function migrate(raw: unknown): Profile {
  const out: Profile = { ...emptyProfile, customAnswers: [], languages: [] };
  if (!raw || typeof raw !== 'object') return out;
  const src = upgrade(raw as Record<string, unknown>);
  const target = out as unknown as Record<string, unknown>;
  for (const key of Object.keys(emptyProfile) as (keyof Profile)[]) {
    const value = src[key];
    if (value === undefined || value === null) continue;
    if (key === 'cv' || key === 'coverLetterFile') {
      const f = value as Partial<StoredFile>;
      if (typeof f.name === 'string' && typeof f.dataUrl === 'string') {
        target[key] = { name: f.name, type: typeof f.type === 'string' ? f.type : '', dataUrl: f.dataUrl };
      }
    } else if (key === 'languages') {
      if (Array.isArray(value)) {
        out.languages = value
          .filter((l) => l && typeof l.language === 'string')
          .map((l, i) => ({
            id: typeof l.id === 'string' ? l.id : `l${i}`,
            language: l.language,
            level: (LANGUAGE_LEVELS as readonly string[]).includes(l.level) ? l.level : '',
          }));
      }
    } else if (key === 'customAnswers') {
      if (Array.isArray(value)) {
        out.customAnswers = value
          .filter((a) => a && typeof a.keywords === 'string' && typeof a.answer === 'string')
          .map((a, i) => ({ id: typeof a.id === 'string' ? a.id : `a${i}`, keywords: a.keywords, answer: a.answer }));
      }
    } else if (typeof value === 'string') {
      target[key] = value;
    }
  }
  out.version = PROFILE_VERSION;
  if (out.salaryPeriod !== 'month') out.salaryPeriod = 'year';
  return out;
}
