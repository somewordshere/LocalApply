import type { Field } from './types';

const MARK = 'data-jaf-mark';
const PREVIOUS = 'data-jaf-outline';

const COLORS = { filled: '#16a34a', attention: '#d97706' };

function target(field: Field): HTMLElement {
  // For choices, outline the option that was picked, not whichever happens to come first.
  const picked = field.options.find((o) => (o.el as HTMLInputElement).checked)?.el;
  const el = (field.kind === 'radio' || field.kind === 'checkgroup') && picked ? picked : field.el;
  const hiddenControl =
    field.kind === 'radio' || field.kind === 'checkgroup' || field.kind === 'checkbox' || field.kind === 'file';
  return hiddenControl ? (el.parentElement ?? el) : el;
}

export function highlight(field: Field, state: keyof typeof COLORS): void {
  const el = target(field);
  if (!el.hasAttribute(MARK)) el.setAttribute(PREVIOUS, el.style.outline);
  el.setAttribute(MARK, state);
  el.style.outline = `2px solid ${COLORS[state]}`;
  el.style.outlineOffset = '1px';
}

function clearIn(root: ParentNode): void {
  for (const el of root.querySelectorAll<HTMLElement>(`[${MARK}]`)) {
    el.style.outline = el.getAttribute(PREVIOUS) ?? '';
    el.style.outlineOffset = '';
    el.removeAttribute(MARK);
    el.removeAttribute(PREVIOUS);
  }
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    if (el.shadowRoot) clearIn(el.shadowRoot);
  }
}

export function clearHighlights(doc: Document): void {
  clearIn(doc);
}
