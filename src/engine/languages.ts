import type { LanguageLevel, SpokenLanguage } from '../profile/schema';
import { escapeRegex, norm } from './text';

/**
 * Names of a language as forms write them, in the eight interface languages (Polish also in the genitive,
 * "znajomość języka niemieckiego"). Written the way norm() leaves them.
 */
const LANGUAGE_NAMES: string[][] = [
  ['english', 'englisch', 'anglais', 'ingles', 'inglese', 'engels', 'angielski', 'angielskiego'],
  ['german', 'deutsch', 'allemand', 'aleman', 'tedesco', 'duits', 'alemao', 'niemiecki', 'niemieckiego'],
  ['french', 'franzosisch', 'francais', 'frances', 'francese', 'frans', 'francuski', 'francuskiego'],
  ['spanish', 'spanisch', 'espagnol', 'espanol', 'spagnolo', 'spaans', 'espanhol', 'hiszpanski', 'hiszpanskiego'],
  ['italian', 'italienisch', 'italien', 'italiano', 'italiaans', 'wloski', 'wloskiego'],
  [
    'dutch',
    'niederlandisch',
    'neerlandais',
    'neerlandes',
    'olandese',
    'nederlands',
    'holandes',
    'niderlandzki',
    'niderlandzkiego',
  ],
  ['portuguese', 'portugiesisch', 'portugais', 'portugues', 'portoghese', 'portugees', 'portugalski', 'portugalskiego'],
  ['polish', 'polnisch', 'polonais', 'polaco', 'polacco', 'pools', 'polski', 'polskiego'],
  ['russian', 'russisch', 'russe', 'ruso', 'russo', 'russisch', 'rosyjski', 'rosyjskiego'],
  ['ukrainian', 'ukrainisch', 'ukrainien', 'ucraniano', 'ucraino', 'oekraiens', 'ukrainski', 'ukrainskiego'],
  ['turkish', 'turkisch', 'turc', 'turco', 'turks', 'turecki', 'tureckiego'],
  ['chinese', 'mandarin', 'chinesisch', 'chinois', 'chino', 'cinese', 'chinees', 'chines', 'chinski', 'chinskiego'],
  ['arabic', 'arabisch', 'arabe', 'arabo', 'arabski', 'arabskiego'],
  ['japanese', 'japanisch', 'japonais', 'japones', 'giapponese', 'japans', 'japonski', 'japonskiego'],
  ['swedish', 'schwedisch', 'suedois', 'sueco', 'svedese', 'zweeds', 'szwedzki', 'szwedzkiego'],
];

/** Options a proficiency question offers for each level, best first; the last entries are the nearest neighbours. */
const LEVEL_NAMES: Record<Exclude<LanguageLevel, ''>, string[]> = {
  native: [
    'Native',
    'Native speaker',
    'Native or bilingual proficiency',
    'Mother tongue',
    'Bilingual',
    'Muttersprache',
    'Muttersprachlich',
    'Langue maternelle',
    'Natif',
    'Nativo',
    'Lengua materna',
    'Madrelingua',
    'Moedertaal',
    'Língua materna',
    'Ojczysty',
    'Język ojczysty',
    'C2',
  ],
  C2: [
    'C2',
    'Proficient',
    'Mastery',
    'Full professional proficiency',
    'Fluent',
    'Verhandlungssicher',
    'Fließend',
    'Courant',
    'Bilingue',
    'Fluido',
    'Vloeiend',
    'Fluente',
    'Biegły',
    'C1',
  ],
  C1: [
    'C1',
    'Advanced',
    'Fluent',
    'Full professional proficiency',
    'Verhandlungssicher',
    'Fließend',
    'Sehr gut',
    'Avancé',
    'Courant',
    'Avanzado',
    'Avanzato',
    'Gevorderd',
    'Vloeiend',
    'Avançado',
    'Zaawansowany',
    'B2',
  ],
  B2: [
    'B2',
    'Upper intermediate',
    'Professional working proficiency',
    'Good',
    'Gut',
    'Gute Kenntnisse',
    'Intermédiaire avancé',
    'Intermedio alto',
    'Intermedio avanzato',
    'Goed',
    'Intermédio avançado',
    'Średnio zaawansowany',
    'B1',
  ],
  B1: [
    'B1',
    'Intermediate',
    'Conversational',
    'Limited working proficiency',
    'Mittel',
    'Gute Grundkenntnisse',
    'Intermédiaire',
    'Intermedio',
    'Redelijk',
    'Intermédio',
    'Średni',
    'A2',
  ],
  A2: [
    'A2',
    'Elementary',
    'Elementary proficiency',
    'Basic',
    'Grundkenntnisse',
    'Élémentaire',
    'Básico',
    'Elementare',
    'Basis',
    'Podstawowy',
    'A1',
  ],
  A1: [
    'A1',
    'Beginner',
    'Elementary proficiency',
    'Basic',
    'Anfänger',
    'Grundkenntnisse',
    'Débutant',
    'Principiante',
    'Iniciante',
    'Początkujący',
  ],
};

/** How a level reads in a list such as "German (C1), English (native)". */
const LEVEL_IN_LIST: Record<Exclude<LanguageLevel, ''>, string> = {
  native: 'native',
  C2: 'C2',
  C1: 'C1',
  B2: 'B2',
  B1: 'B1',
  A2: 'A2',
  A1: 'A1',
};

const filled = (languages: SpokenLanguage[]) => languages.filter((l) => l.language.trim());

/** The person's languages as one line: "German (C1), English (native)". */
export function languageList(languages: SpokenLanguage[]): string {
  return filled(languages)
    .map((l) => (l.level ? `${l.language.trim()} (${LEVEL_IN_LIST[l.level]})` : l.language.trim()))
    .join(', ');
}

/** Every name the language goes by, so "Deutsch" in the profile is found in "German proficiency". */
function namesOf(language: string): string[] {
  const own = norm(language);
  const group = LANGUAGE_NAMES.find((names) => names.includes(own));
  return group ? [...new Set([own, ...group])] : [own];
}

/**
 * The language a proficiency question is about: the one the label names (German compounds such as
 * "Deutschkenntnisse" included), otherwise the n-th language for the n-th such question on the page.
 */
export function languageFor(languages: SpokenLanguage[], label: string, index: number): SpokenLanguage | undefined {
  const list = filled(languages);
  const text = norm(label);
  const named = list.find((l) =>
    // Names start a word but may run on into a compound ("deutschkenntnisse", "englischniveau").
    new RegExp(`(?<![\\p{L}\\p{N}])(?:${namesOf(l.language).map(escapeRegex).join('|')})`, 'u').test(text),
  );
  return named ?? list[index];
}

/** Options to try for a level, best first. */
export function levelNames(level: LanguageLevel): string[] {
  return level ? LEVEL_NAMES[level] : [];
}
