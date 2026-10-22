import { browser } from 'wxt/browser';
import type { MessageKey } from './i18n';

/**
 * Colour palettes for the interface. The CSS values live in style.css; the colours here draw the
 * swatches and the on-page notice, which sits outside the stylesheet's reach: accent, hover and
 * paper are the light-mode colours, light and lighter the dark-mode accents.
 */
export const PALETTES = {
  forest: {
    name: 'palette.forest',
    accent: '#1f6b4f',
    hover: '#175a41',
    paper: '#f3f0e8',
    light: '#74c79f',
    lighter: '#93d6b5',
  },
  ocean: {
    name: 'palette.ocean',
    accent: '#24569c',
    hover: '#1c4682',
    paper: '#eef1f5',
    light: '#7fb0ec',
    lighter: '#a0c5f2',
  },
  plum: {
    name: 'palette.plum',
    accent: '#6b3d8f',
    hover: '#592f79',
    paper: '#f3f0f4',
    light: '#c39be0',
    lighter: '#d4b5ea',
  },
  clay: {
    name: 'palette.clay',
    accent: '#a3471f',
    hover: '#8a3b19',
    paper: '#f4eee7',
    light: '#ec9a72',
    lighter: '#f2b394',
  },
  graphite: {
    name: 'palette.graphite',
    accent: '#26262b',
    hover: '#000000',
    paper: '#f1f1ef',
    light: '#e6e6e8',
    lighter: '#ffffff',
  },
} satisfies Record<
  string,
  { name: MessageKey; accent: string; hover: string; paper: string; light: string; lighter: string }
>;

export type Palette = keyof typeof PALETTES;

/** Kept apart from the profile, like the language: it is a setting, not something forms ask for. */
const KEY = 'uiPalette';
export const DEFAULT_PALETTE: Palette = 'forest';

export function isPalette(value: unknown): value is Palette {
  return typeof value === 'string' && Object.hasOwn(PALETTES, value);
}

export async function loadPalette(): Promise<Palette> {
  const stored = await browser.storage.local.get(KEY);
  return isPalette(stored[KEY]) ? stored[KEY] : DEFAULT_PALETTE;
}

export async function savePalette(palette: Palette): Promise<void> {
  await browser.storage.local.set({ [KEY]: palette });
}

/** Calls back when the palette is changed, here or in another page. Returns a stop function. */
export function watchPalette(onChange: (palette: Palette) => void): () => void {
  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
    const next = changes[KEY]?.newValue;
    if (area === 'local' && isPalette(next)) onChange(next);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

/** Switches the page's colours; style.css keys the palettes on this attribute. */
export function applyPalette(palette: Palette): void {
  document.documentElement.dataset.palette = palette;
}

/** Applies the saved palette, then keeps following changes made on other pages. Call before the first render. */
export async function startPalette(): Promise<void> {
  applyPalette(await loadPalette());
  watchPalette(applyPalette);
}
