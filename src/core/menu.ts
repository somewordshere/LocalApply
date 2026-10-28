import { browser } from 'wxt/browser';
import { resolve } from '../engine/resolve';
import type { FieldKey } from '../engine/types';
import type { Profile } from '../profile/schema';
import { loadProfile } from '../profile/store';
import { translator, type MessageKey, type Translate } from '../ui/i18n';
import { loadLanguage } from '../ui/language';

const ROOT = 'fill-with';
const KEY_PREFIX = 'key:';
const ANSWER_PREFIX = 'answer:';
const EDIT = 'edit-profile';
const MAX_PREVIEW = 40;

/** What the menu offers from the profile, in the order of the profile page. Brand names stay as they are. */
const ITEMS: [FieldKey, MessageKey | string][] = [
  ['fullName', 'menu.fullName'],
  ['firstName', 'field.firstName'],
  ['lastName', 'field.lastName'],
  ['email', 'field.email'],
  ['phone', 'phone.label'],
  ['street', 'field.street'],
  ['postcode', 'field.postcode'],
  ['city', 'field.city'],
  ['country', 'field.country'],
  ['linkedin', 'LinkedIn'],
  ['github', 'GitHub'],
  ['website', 'field.website'],
  ['xing', 'Xing'],
  ['salary', 'field.salaryAmount'],
  ['noticePeriod', 'field.noticePeriod'],
  ['currentTitle', 'experience.title'],
  ['currentEmployer', 'experience.employer'],
  ['school', 'field.school'],
  ['degree', 'field.degree'],
  ['coverLetterText', 'documents.coverLetterText'],
];

export interface MenuItem {
  id: string;
  title: string;
}

/** The text a profile key puts into a single box: the first thing resolve() would type. */
function valueOf(key: FieldKey, profile: Profile): string {
  return resolve(key, profile, { has: () => false, numeric: false })[0] ?? '';
}

function preview(text: string): string {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > MAX_PREVIEW ? `${line.slice(0, MAX_PREVIEW - 1)}…` : line;
}

/** Menus treat "&" as an access-key marker; "&&" shows one. */
const menuText = (s: string) => s.replace(/&/g, '&&');

/**
 * The "Fill this field with" submenu for a profile: each filled-in detail with a preview of its value,
 * then the saved answers. Empty details are left out.
 */
export function menuItems(profile: Profile, t: Translate): { details: MenuItem[]; answers: MenuItem[] } {
  const label = (key: MessageKey | string) => (key.includes('.') ? t(key as MessageKey) : key);
  const details = ITEMS.flatMap(([key, name]) => {
    const value = valueOf(key, profile);
    return value ? [{ id: KEY_PREFIX + key, title: `${label(name)}: ${preview(value)}` }] : [];
  });
  const answers = profile.customAnswers
    .filter((a) => a.answer.trim())
    .map((a) => {
      const question = a.keywords.split(',')[0].trim();
      return {
        id: ANSWER_PREFIX + a.id,
        title: question ? `${preview(question)}: ${preview(a.answer)}` : preview(a.answer),
      };
    });
  return { details, answers };
}

/** The text a menu item stands for, read from the profile when it is chosen; null for anything else. */
export function menuValue(id: string, profile: Profile): string | null {
  if (id.startsWith(KEY_PREFIX)) return valueOf(id.slice(KEY_PREFIX.length) as FieldKey, profile) || null;
  if (id.startsWith(ANSWER_PREFIX)) {
    return profile.customAnswers.find((a) => a.id === id.slice(ANSWER_PREFIX.length))?.answer || null;
  }
  return null;
}

export const isEditItem = (id: string) => id === EDIT;

const menus = () => browser.contextMenus;

function add(props: Parameters<typeof browser.contextMenus.create>[0]): void {
  // Errors (an id created twice while an older build was still running) arrive here instead of as a throw.
  menus().create(props, () => void browser.runtime.lastError);
}

async function build(): Promise<void> {
  const [profile, lang] = await Promise.all([loadProfile(), loadLanguage()]);
  const t = translator(lang);
  const { details, answers } = menuItems(profile, t);
  await menus().removeAll();
  add({ id: ROOT, title: t('menu.fillWith'), contexts: ['editable'] });
  for (const item of details) add({ id: item.id, title: menuText(item.title), parentId: ROOT, contexts: ['editable'] });
  if (details.length && answers.length)
    add({ id: 'sep-answers', type: 'separator', parentId: ROOT, contexts: ['editable'] });
  for (const item of answers) add({ id: item.id, title: menuText(item.title), parentId: ROOT, contexts: ['editable'] });
  if (!details.length && !answers.length) {
    add({ id: 'empty', title: t('menu.empty'), enabled: false, parentId: ROOT, contexts: ['editable'] });
  }
  add({ id: 'sep-edit', type: 'separator', parentId: ROOT, contexts: ['editable'] });
  add({ id: EDIT, title: t('popup.editProfile'), parentId: ROOT, contexts: ['editable'] });
}

// One build at a time, so two quick saves can't interleave their removeAll and create calls.
let building: Promise<void> = Promise.resolve();
let pending: ReturnType<typeof setTimeout> | undefined;

/** Rebuilds the menu from the active profile, shortly after the last call (saves come with every keystroke). */
export function refreshMenu(delay = 300): void {
  clearTimeout(pending);
  pending = setTimeout(() => {
    building = building.then(build).catch(() => {});
  }, delay);
}

/** Keeps the menu in step with the active profile, its saved answers and the interface language. */
export function watchMenu(): void {
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (Object.keys(changes).some((key) => key.startsWith('profile') || key === 'uiLanguage')) refreshMenu();
  });
}
