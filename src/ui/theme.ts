import { browser } from 'wxt/browser';
import type { MessageKey } from './i18n';

/** Light or dark interface: following the system, or chosen on the profile page. */
export const THEMES = {
  system: 'theme.system',
  light: 'theme.light',
  dark: 'theme.dark',
} satisfies Record<string, MessageKey>;

export type Theme = keyof typeof THEMES;

/** Kept apart from the profile, like the language and palette. */
const KEY = 'uiTheme';
export const DEFAULT_THEME: Theme = 'system';

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)');

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && Object.hasOwn(THEMES, value);
}

export async function loadTheme(): Promise<Theme> {
  const stored = await browser.storage.local.get(KEY);
  return isTheme(stored[KEY]) ? stored[KEY] : DEFAULT_THEME;
}

export async function saveTheme(theme: Theme): Promise<void> {
  await browser.storage.local.set({ [KEY]: theme });
}

/** Calls back when the theme is changed, here or in another page. Returns a stop function. */
export function watchTheme(onChange: (theme: Theme) => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    const next = changes[KEY]?.newValue;
    if (area === 'local' && isTheme(next)) onChange(next);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

/** Sets data-scheme, which style.css keys the dark colours on, to light or dark. */
function applyScheme(): void {
  const root = document.documentElement;
  const theme = isTheme(root.dataset.theme) ? root.dataset.theme : DEFAULT_THEME;
  root.dataset.scheme = theme === 'system' ? (systemDark().matches ? 'dark' : 'light') : theme;
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  applyScheme();
}

/**
 * Applies the saved theme, then keeps following changes made on other pages and, for System,
 * changes to the system's own setting. Call before the first render.
 */
export async function startTheme(): Promise<void> {
  // The system's choice right away, so nothing waits on storage to be dark.
  applyScheme();
  systemDark().addEventListener('change', applyScheme);
  applyTheme(await loadTheme());
  watchTheme(applyTheme);
}
