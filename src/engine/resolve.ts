import type { Profile, YesNo } from '../profile/schema';
import { languageFor, languageList, levelNames } from './languages';
import { norm } from './text';
import type { FieldKey } from './types';

const YES = ['Yes', 'Ja', 'Oui', 'Sí', 'Si', 'Sim', 'Tak', 'true', 'y'];
const NO = ['No', 'Nein', 'Non', 'Nee', 'Não', 'Nie', 'false', 'n'];

/** Names and codes under which a country appears in dropdowns. */
const COUNTRIES: string[][] = [
  ['Germany', 'Deutschland', 'Allemagne', 'Alemania', 'Germania', 'Duitsland', 'Alemanha', 'Niemcy', 'DE', 'DEU'],
  ['Austria', 'Österreich', 'Autriche', 'Oostenrijk', 'AT', 'AUT'],
  ['Switzerland', 'Schweiz', 'Suisse', 'Suiza', 'Svizzera', 'Zwitserland', 'Suíça', 'Szwajcaria', 'CH', 'CHE'],
  [
    'United States',
    'United States of America',
    'USA',
    'US',
    'Vereinigte Staaten',
    'États-Unis',
    'Estados Unidos',
    'Stati Uniti',
    'Verenigde Staten',
  ],
  [
    'United Kingdom',
    'UK',
    'GB',
    'GBR',
    'Great Britain',
    'Vereinigtes Königreich',
    'Großbritannien',
    'Royaume-Uni',
    'Reino Unido',
    'Regno Unito',
    'Verenigd Koninkrijk',
  ],
  [
    'Netherlands',
    'The Netherlands',
    'Niederlande',
    'Pays-Bas',
    'Países Bajos',
    'Paesi Bassi',
    'Nederland',
    'NL',
    'NLD',
  ],
  ['France', 'Frankreich', 'Francia', 'Frankrijk', 'França', 'Francja', 'FR', 'FRA'],
  ['Spain', 'Spanien', 'Espagne', 'España', 'Spagna', 'Spanje', 'Espanha', 'Hiszpania', 'ES', 'ESP'],
  ['Italy', 'Italien', 'Italie', 'Italia', 'Italië', 'Itália', 'Włochy', 'IT', 'ITA'],
  ['Portugal', 'PT', 'PRT'],
  ['Poland', 'Polen', 'Pologne', 'Polonia', 'Polônia', 'Polska', 'PL', 'POL'],
  ['Belgium', 'Belgien', 'Belgique', 'Bélgica', 'Belgio', 'België', 'Belgia', 'BE', 'BEL'],
  ['Ireland', 'Irland', 'Irlande', 'Irlanda', 'Ierland', 'IE', 'IRL'],
  ['Canada', 'Kanada', 'Canadá', 'CA', 'CAN'],
  ['Sweden', 'Schweden', 'Suède', 'Suecia', 'Svezia', 'Zweden', 'Sverige', 'SE', 'SWE'],
  ['Denmark', 'Dänemark', 'Danemark', 'Dinamarca', 'Danimarca', 'Denemarken', 'Danmark', 'DK', 'DNK'],
  ['Czech Republic', 'Czechia', 'Tschechien', 'Tchéquie', 'CZ', 'CZE'],
];

const GENDERS: string[][] = [
  [
    'Male',
    'Man',
    'Männlich',
    'Mann',
    'Homme',
    'Masculin',
    'Hombre',
    'Masculino',
    'Uomo',
    'Maschio',
    'Mężczyzna',
    'M',
    'Herr',
    'Mr',
    'Monsieur',
    'Señor',
    'Signor',
    'De heer',
    'Pan',
  ],
  [
    'Female',
    'Woman',
    'Weiblich',
    'Frau',
    'Femme',
    'Féminin',
    'Mujer',
    'Femenino',
    'Donna',
    'Femmina',
    'Vrouw',
    'Feminino',
    'Kobieta',
    'F',
    'W',
    'Ms',
    'Mrs',
    'Madame',
    'Señora',
    'Signora',
    'Mevrouw',
    'Pani',
  ],
  [
    'Non-binary',
    'Nonbinary',
    'Diverse',
    'Divers',
    'Other',
    'Andere',
    'Autre',
    'Otro',
    'Altro',
    'Anders',
    'Outro',
    'X',
    'D',
  ],
  [
    'Prefer not to say',
    'Decline to self-identify',
    "I don't wish to answer",
    'Keine Angabe',
    'Ne souhaite pas répondre',
    'Prefiero no decirlo',
  ],
];

const SALUTATIONS: string[][] = [
  ['Mr', 'Mr.', 'Herr', 'Monsieur', 'M.', 'Señor', 'Sr.', 'Sr', 'Signor', 'Sig.', 'De heer', 'Dhr.', 'Pan'],
  [
    'Ms',
    'Ms.',
    'Mrs',
    'Mrs.',
    'Frau',
    'Madame',
    'Mme',
    'Señora',
    'Sra.',
    'Sra',
    'Signora',
    'Sig.ra',
    'Mevrouw',
    'Mevr.',
    'Pani',
  ],
  ['Mx', 'Mx.', 'Divers', 'Diverse', 'Other', 'Keine Angabe'],
];

/** Names under which each education level appears in dropdowns and radio groups. Profile values come first. */
const EDUCATION_LEVELS: string[][] = [
  [
    'High school',
    'High school diploma',
    'Secondary school',
    'Secondary education',
    'GED',
    'Abitur',
    'Allgemeine Hochschulreife',
    'Fachhochschulreife',
    'Fachabitur',
    'Baccalauréat',
    'Bac',
    'Bachillerato',
    'Diploma di scuola superiore',
    'Maturità',
    'Middelbare school',
    'VWO',
    'HAVO',
    'Ensino secundário',
    'Ensino médio',
    'Średnie',
    'Matura',
  ],
  [
    'Vocational training',
    'Vocational qualification',
    'Vocational',
    'Apprenticeship',
    'Trade school',
    'Technical certification',
    'Certification',
    'Berufsausbildung',
    'Abgeschlossene Berufsausbildung',
    'Ausbildung',
    'Formation professionnelle',
    'CAP',
    'Formación profesional',
    'Formazione professionale',
    'MBO',
    'Ensino profissional',
    'Zawodowe',
  ],
  [
    'Associate degree',
    "Associate's degree",
    'Associate',
    'Bac +2',
    'BTS',
    'DUT',
    'Técnico superior',
    'Diploma ITS',
    'CTeSP',
    'Policealne',
  ],
  [
    "Bachelor's degree",
    'Bachelor degree',
    'Bachelors degree',
    'Bachelor',
    'Bachelors',
    'Undergraduate degree',
    'BSc',
    'BA',
    'Bachelorabschluss',
    'Licence',
    'Bac +3',
    'Grado',
    'Laurea triennale',
    'Licenciatura',
    'Licencjat',
    'Inżynier',
  ],
  [
    "Master's degree",
    'Master degree',
    'Masters degree',
    'Master',
    'Masters',
    'Graduate degree',
    'Postgraduate degree',
    'MSc',
    'MA',
    'Masterabschluss',
    'Diplom',
    'Magister',
    'Staatsexamen',
    'Bac +5',
    'Máster',
    'Laurea magistrale',
    'Mestrado',
  ],
  ['MBA', 'Master of Business Administration'],
  [
    'PhD',
    'Doctorate',
    'Doctoral degree',
    'Doctor',
    'Promotion',
    'Doktor',
    'Doktorat',
    'Doctorat',
    'Doctorado',
    'Dottorato',
    'Doctoraat',
    'Promotie',
    'Doutoramento',
    'Doutorado',
  ],
  ['Other', 'Sonstiges', 'Sonstige', 'Andere', 'Autre', 'Otro', 'Altro', 'Anders', 'Outro', 'Inne'],
];

/** Names under which each sexual orientation appears in dropdowns and radio groups. */
const ORIENTATIONS: string[][] = [
  [
    'Heterosexual',
    'Straight',
    'Heterosexual / straight',
    'Heterosexual or straight',
    'Hetero',
    'Heterosexuell',
    'Hétérosexuel',
    'Hétérosexuelle',
    'Eterosessuale',
    'Heteroseksueel',
    'Heteroseksualna',
    'Heteroseksualny',
    'Heterossexual',
  ],
  [
    'Gay',
    'Gay man',
    'Schwul',
    'Homo',
    'Gej',
    'Homosexual',
    'Homosexuell',
    'Homosexuel',
    'Omosessuale',
    'Homoseksueel',
    'Homossexual',
  ],
  [
    'Lesbian',
    'Lesbisch',
    'Lesbienne',
    'Lesbiana',
    'Lesbica',
    'Lesbijka',
    'Lésbica',
    'Homosexual',
    'Homosexuell',
    'Homosexuelle',
    'Omosessuale',
    'Homoseksueel',
    'Homossexual',
  ],
  [
    'Bisexual',
    'Bisexuell',
    'Bisexuel',
    'Bisexuelle',
    'Bisessuale',
    'Biseksueel',
    'Biseksualna',
    'Biseksualny',
    'Bissexual',
  ],
  [
    'Pansexual',
    'Pansexuell',
    'Pansexuel',
    'Pansexuelle',
    'Pansessuale',
    'Panseksueel',
    'Panseksualna',
    'Panseksualny',
    'Panssexual',
  ],
  ['Asexual', 'Asexuell', 'Asexuel', 'Asexuelle', 'Asessuale', 'Aseksueel', 'Aseksualna', 'Aseksualny', 'Assexual'],
  ['Queer'],
  [
    'Prefer not to say',
    "I don't wish to answer",
    'Decline to self-identify',
    'Decline to answer',
    'Prefer not to answer',
    'Keine Angabe',
    'Ne souhaite pas répondre',
    'Je préfère ne pas répondre',
    'Prefiero no decirlo',
    'Prefiero no responder',
    'Preferisco non dirlo',
    'Preferisco non rispondere',
    'Zeg ik liever niet',
    'Wolę nie podawać',
    'Prefiro não dizer',
  ],
];

function withSynonyms(value: string, table: string[][]): string[] {
  const v = norm(value);
  if (!v) return [];
  const group = table.find((g) => g.some((name) => norm(name) === v));
  return group ? [value, ...group] : [value];
}

function yesNo(value: YesNo): string[] {
  return value === 'yes' ? YES : value === 'no' ? NO : [];
}

export interface ResolveContext {
  /** Whether another field on the page maps to the given key. */
  has: (key: FieldKey) => boolean;
  /** The field only accepts digits. */
  numeric: boolean;
  /** The field's label, for questions that name what they ask about ("German proficiency"). */
  label?: string;
  /** How many fields with the same key came before this one on the page. */
  index?: number;
}

/**
 * Values to try for a key, best first. The first entry is what gets typed into text fields;
 * the rest are alternatives for matching dropdown and radio options. Empty when the profile has no value.
 */
export function resolve(key: FieldKey, p: Profile, ctx: ResolveContext): string[] {
  const one = (s: string) => (s.trim() ? [s.trim()] : []);
  const join = (...parts: string[]) =>
    parts
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ');

  switch (key) {
    case 'fullName':
      return one(join(p.firstName, p.lastName));
    case 'phone': {
      if (!p.phoneNumber.trim()) return [];
      if (ctx.has('phoneCountryCode')) return one(p.phoneNumber);
      const full = join(p.phoneCountryCode, p.phoneNumber);
      return ctx.numeric ? one(full.replace(/^\+/, '00').replace(/\D/g, '')) : one(full);
    }
    case 'phoneCountryCode': {
      const code = p.phoneCountryCode.trim();
      if (!code) return [];
      return [code, code.replace(/^\+/, '00'), code.replace(/^\+/, ''), ...withSynonyms(p.country, COUNTRIES)];
    }
    case 'street':
      return one(ctx.has('houseNumber') ? p.street : join(p.street, p.houseNumber));
    case 'website':
      return one(p.website || p.github);
    case 'country':
      return withSynonyms(p.country, COUNTRIES);
    case 'nationality':
      return one(p.nationality);
    case 'location':
      return one([p.city.trim(), p.country.trim()].filter(Boolean).join(', '));
    case 'salaryMin':
    case 'salaryMax': {
      const amount = (key === 'salaryMin' ? p.salaryMin : p.salaryMax).trim() || p.salaryAmount.trim();
      if (!amount) return [];
      const digits = amount.replace(/[^\d]/g, '');
      if (ctx.numeric) return one(digits);
      if (ctx.has('salaryCurrency')) return one(amount);
      return [join(amount, p.salaryCurrency), amount, digits];
    }
    case 'salary': {
      const amount = p.salaryAmount.trim();
      if (!amount) return [];
      const digits = amount.replace(/[^\d]/g, '');
      if (ctx.numeric) return one(digits);
      if (ctx.has('salaryCurrency')) return one(amount);
      return [join(amount, p.salaryCurrency), amount, digits];
    }
    case 'salaryCurrency':
      return one(p.salaryCurrency);
    case 'yearsOfExperience': {
      const years = p.yearsOfExperience.trim();
      return years ? [years, `${years} years`, `${years}+`] : [];
    }
    case 'workAuthorized':
    case 'needsSponsorship':
    case 'willingToRelocate':
    case 'willingToTravel':
    case 'drivingLicence':
    case 'disability':
    case 'veteran':
      return yesNo(p[key]);
    // Forms mix the two up ("Geschlecht: Herr / Frau"), so each also offers the other's wording to dropdowns.
    case 'gender':
      return p.gender ? [...withSynonyms(p.gender, GENDERS), ...withSynonyms(p.salutation, SALUTATIONS)] : [];
    case 'salutation':
      return p.salutation ? [...withSynonyms(p.salutation, SALUTATIONS), ...withSynonyms(p.gender, GENDERS)] : [];
    case 'educationLevel': {
      const level = withSynonyms(p.educationLevel, EDUCATION_LEVELS);
      // An MBA is a master's to forms that don't list it on its own.
      if (norm(p.educationLevel) === 'mba') level.push(...withSynonyms("Master's degree", EDUCATION_LEVELS));
      return level.length ? level : one(p.degree);
    }
    // A "Degree" dropdown usually lists levels (Bachelor, Master), which the free-text degree rarely matches.
    case 'degree':
      return [...one(p.degree), ...withSynonyms(p.educationLevel, EDUCATION_LEVELS)];
    case 'drivingLicenceClass': {
      const classes = p.drivingLicenceClass.trim();
      // "B, BE" goes into a text box as written; a list of classes is tried one by one.
      return classes ? [classes, ...classes.split(/[\s,;/]+/).filter(Boolean)] : [];
    }
    case 'languages':
      return one(languageList(p.languages));
    case 'languageLevel':
      return levelNames(languageFor(p.languages, ctx.label ?? '', ctx.index ?? 0)?.level ?? '');
    case 'sexualOrientation':
      return withSynonyms(p.sexualOrientation, ORIENTATIONS);
    case 'cv':
    case 'coverLetterFile':
      return p[key] ? [p[key]!.name] : [];
    default:
      return one(p[key]);
  }
}
