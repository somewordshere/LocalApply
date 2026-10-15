import type { Field } from './types';

const MARK = 'data-jaf-mark';
const PREVIOUS = 'data-jaf-outline';

/** Colour and line style differ, so the two states stay apart without telling green from amber. */
const OUTLINES = { filled: '2px solid #16a34a', attention: '2px dashed #d97706' };

function target(field: Field): HTMLElement {
  // For choices, outline the option that was picked, not whichever happens to come first.
  const picked = field.options.find((o) => (o.el as HTMLInputElement).checked)?.el;
  const el = (field.kind === 'radio' || field.kind === 'checkgroup') && picked ? picked : field.el;
  const hiddenControl =
    field.kind === 'radio' || field.kind === 'checkgroup' || field.kind === 'checkbox' || field.kind === 'file';
  return hiddenControl ? (el.parentElement ?? el) : el;
}

export function highlight(field: Field, state: keyof typeof OUTLINES): void {
  const el = target(field);
  if (!el.hasAttribute(MARK)) el.setAttribute(PREVIOUS, el.style.outline);
  el.setAttribute(MARK, state);
  el.style.outline = OUTLINES[state];
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
