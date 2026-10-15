import type { StoredFile } from '../profile/schema';
import { isVisible } from './scan';
import { norm, pickOption } from './text';
import type { Field } from './types';

export function fire(el: Element, type: string): void {
  el.dispatchEvent(new Event(type, { bubbles: true, composed: true }));
}

function press(el: Element): void {
  for (const type of ['mousedown', 'mouseup', 'click']) {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, composed: true }));
  }
}

/**
 * Sets the value through the prototype setter. Frameworks such as React replace the
 * setter on the element itself to track changes; going around it makes the following
 * input event register as a real edit.
 */
export function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
  const max = el.maxLength > 0 ? el.maxLength : Infinity;
  fire(el, 'focus');
  fire(el, 'focusin');
  setNativeValue(el, value.slice(0, max));
  fire(el, 'input');
  fire(el, 'change');
  fire(el, 'blur');
  fire(el, 'focusout');
  return el.value !== '';
}

/**
 * Rich text editors (ProseMirror, Draft.js, Quill) keep their own copy of the text and
 * ignore direct DOM changes, so the text goes in as an edit the editor sees, replacing
 * whatever is selected. Plain contenteditable elements get their text set directly.
 * An empty value clears the editor.
 */
export function typeIntoEditor(el: HTMLElement, value: string): boolean {
  const doc = el.ownerDocument;
  el.focus();
  const selection = doc.getSelection();
  let inserted = false;
  if (selection && typeof doc.execCommand === 'function') {
    const range = doc.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
    try {
      inserted = value ? doc.execCommand('insertText', false, value) : doc.execCommand('delete');
    } catch {
      inserted = false;
    }
  }
  if (!inserted) {
    el.textContent = value;
    fire(el, 'input');
  }
  fire(el, 'blur');
  return (el.textContent ?? '').trim() !== '';
}

function toFile(stored: StoredFile): File {
  const base64 = stored.dataUrl.slice(stored.dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], stored.name, { type: stored.type || 'application/pdf' });
}

export function attachFile(el: HTMLInputElement, stored: StoredFile): boolean {
  if (typeof DataTransfer === 'undefined') return false;
  try {
    const transfer = new DataTransfer();
    transfer.items.add(toFile(stored));
    el.files = transfer.files;
  } catch {
    return false;
  }
  fire(el, 'input');
  fire(el, 'change');
  return el.files?.length === 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function listOptions(el: HTMLElement): HTMLElement[] {
  const controlled = (el.getAttribute('aria-controls') || el.getAttribute('aria-owns') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => el.ownerDocument.getElementById(id))
    .filter((n): n is HTMLElement => Boolean(n));
  const roots: ParentNode[] = controlled.length ? controlled : [el.getRootNode() as ParentNode, el.ownerDocument];
  const seen = new Set<HTMLElement>();
  for (const root of roots) {
    // Hidden options belong to other dropdowns that are closed, not to the one just opened.
    for (const option of root.querySelectorAll<HTMLElement>('[role="option"]')) {
      if (isVisible(option)) seen.add(option);
    }
  }
  return [...seen];
}

const COMBOBOX_TIMEOUT_MS = 1500;
/** Later search terms get less time: the list has usually loaded by then. */
const RETYPE_TIMEOUT_MS = 600;
const MAX_SEARCH_TERMS = 5;

/** Opens a custom dropdown, waits for its options and clicks the matching one. */
async function fillCombobox(el: HTMLElement, candidates: string[]): Promise<boolean> {
  const typed = el instanceof HTMLInputElement && !el.readOnly;
  // A dropdown button that already shows the wanted choice (a preselected phone country, say).
  if (!(el instanceof HTMLInputElement)) {
    const shown = `${el.getAttribute('aria-label') ?? ''} ${el.textContent ?? ''}`;
    if (pickOption([{ text: shown, ref: true }], candidates)) return true;
  }
  el.focus();
  press(el);

  // A searchable dropdown only lists what matches the typed text, so each alternative
  // ("Deutschland", then "Germany") gets typed in turn. A plain one lists everything at once.
  const terms = typed ? [...new Map(candidates.map((c) => [norm(c), c])).values()].slice(0, MAX_SEARCH_TERMS) : [''];
  for (const [i, term] of terms.entries()) {
    if (typed) {
      setNativeValue(el as HTMLInputElement, term);
      fire(el, 'input');
    }
    const deadline = Date.now() + (i === 0 ? COMBOBOX_TIMEOUT_MS : RETYPE_TIMEOUT_MS);
    while (Date.now() < deadline) {
      await sleep(100);
      const options = listOptions(el);
      if (!options.length) continue;
      const match = pickOption(
        options.map((o) => ({ text: o.textContent ?? '', ref: o })),
        candidates,
      );
      if (match) {
        press(match);
        return true;
      }
    }
  }

  // Nothing matched: take the search text back out and close the list rather than leave it covering the form.
  if (typed) {
    setNativeValue(el as HTMLInputElement, '');
    fire(el, 'input');
  } else {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
    if (el.getAttribute('aria-expanded') === 'true') press(el);
  }
  fire(el, 'blur');
  return false;
}

export const DIAL_CODE_ONLY = /^\s*\+?\d{0,4}\s*$/;

/** Text a dropdown shows before anything is picked, in the languages the rules cover. */
const PROMPT =
  /^[-–—.…\s]*(?:$|(?:please )?(?:select|choose|pick)|none\b|bitte|(?:aus)?w[aä]hlen|s[ée]lectionne|choisi|selecciona|elige|seleziona|scegli|selecteer|kies|selecion|escolha|wybierz)/i;

/** True when the control already holds a value the user (or the site) put there. */
export function hasValue(field: Field): boolean {
  const el = field.el;
  switch (field.kind) {
    case 'radio':
    case 'checkgroup':
      return field.options.some((o) => (o.el as HTMLInputElement).checked);
    case 'checkbox':
      return (el as HTMLInputElement).checked;
    case 'file':
      return ((el as HTMLInputElement).files?.length ?? 0) > 0;
    case 'select': {
      const select = el as HTMLSelectElement;
      return select.selectedIndex > 0 && select.value !== '';
    }
    case 'combobox':
      if (el instanceof HTMLInputElement && el.value.trim() !== '') return true;
      // A dropdown button shows the current choice as its text, or a prompt while nothing is chosen.
      if (!(el instanceof HTMLInputElement)) {
        const shown = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        return shown !== '' && !PROMPT.test(shown) && shown !== field.label;
      }
      // react-select keeps the chosen value in a sibling element, not in the input.
      return Boolean(
        el
          .closest('[class*="control"]')
          ?.querySelector(
            '[class*="single-value"], [class*="singleValue"], [class*="multi-value"], [class*="multiValue"]',
          ),
      );
    default:
      // Phone widgets prefill the dial code; that is not an answer yet.
      if (field.type === 'tel' && DIAL_CODE_ONLY.test((el as HTMLInputElement).value)) return false;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value.trim() !== '';
      return (el.textContent ?? '').trim() !== '';
  }
}

/** Writes the first usable candidate into the field. Resolves to whether a value was set. */
export async function fillField(field: Field, candidates: string[]): Promise<boolean> {
  const el = field.el;
  if (!candidates.length) return false;

  switch (field.kind) {
    case 'select': {
      const select = el as HTMLSelectElement;
      const usable = field.options.filter(
        (o) => !(o.el as HTMLOptionElement).disabled && (o.value !== '' || o !== field.options[0]),
      );
      const option = pickOption(
        usable.map((o) => ({ text: o.text, value: o.value, ref: o })),
        candidates,
      );
      if (!option) return false;
      setNativeValue(select, option.value);
      (option.el as HTMLOptionElement).selected = true;
      fire(select, 'input');
      fire(select, 'change');
      return true;
    }
    case 'radio': {
      const option = pickOption(
        field.options.map((o) => ({ text: o.text, value: o.value, ref: o })),
        candidates,
      );
      if (!option) return false;
      const radio = option.el as HTMLInputElement;
      if (!radio.checked) radio.click();
      return radio.checked;
    }
    case 'checkgroup': {
      const option = pickOption(
        field.options.map((o) => ({ text: o.text, value: o.value, ref: o })),
        candidates,
      );
      if (!option) return false;
      const box = option.el as HTMLInputElement;
      if (!box.checked) box.click();
      return box.checked;
    }
    case 'checkbox':
      return false;
    case 'combobox':
      return fillCombobox(el, candidates);
    default: {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return typeInto(el, candidates[0]);
      return typeIntoEditor(el, candidates[0]);
    }
  }
}

/** Formats an ISO date (yyyy-mm-dd) the way the field expects it. */
export function formatDate(iso: string, field: Field): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match;
  if (field.type === 'date') return iso;
  if (field.type === 'month') return `${y}-${m}`;

  const hint = `${field.placeholder} ${field.label}`.toLowerCase();
  // Day/month/year placeholders as written in en, de, fr, es, it, nl, pt and pl (longest tokens first).
  const pattern = /(yyyy|jjjj|aaaa|rrrr|dd|tt|jj|gg|mm)([./-])(dd|tt|jj|gg|mm)\2(yyyy|jjjj|aaaa|rrrr|dd|tt|jj|gg)/.exec(
    hint,
  );
  if (pattern) {
    const part = (token: string) => (token.length === 4 ? y : token === 'mm' ? m : d);
    return [part(pattern[1]), part(pattern[3]), part(pattern[4])].join(pattern[2]);
  }
  const lang = (field.el.ownerDocument.documentElement.lang || '').toLowerCase();
  if (/^(de|pl)/.test(lang)) return `${d}.${m}.${y}`;
  if (/^(fr|es|it|pt|nl|en-gb)/.test(lang)) return `${d}/${m}/${y}`;
  if (/^en-us/.test(lang)) return `${m}/${d}/${y}`;
  return iso;
}
