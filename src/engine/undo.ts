import { fire, setNativeValue, typeIntoEditor } from './fill';
import { clearHighlights, highlight } from './report';
import type { Field } from './types';

/** Puts a field back the way it was before the fill. Resolves to false when that was not possible. */
type Restore = () => boolean;

export interface UndoResult {
  /** Fields put back the way they were. */
  restored: number;
  /** Fields the applicant has to change back by hand (custom dropdowns). */
  manual: { label: string }[];
}

export interface Change {
  field: Field;
  restore: Restore;
}

/** What the most recent fill in this frame changed, in fill order. */
let lastFill: Change[] = [];

function setChecked(input: HTMLInputElement, checked: boolean): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked')?.set;
  if (setter) setter.call(input, checked);
  else input.checked = checked;
  fire(input, 'input');
  fire(input, 'change');
}

/** Captures what the field holds right now so the fill can be taken back. */
export function remember(field: Field): Restore {
  const el = field.el;
  switch (field.kind) {
    case 'radio':
    case 'checkgroup': {
      const inputs = field.options.map((o) => o.el as HTMLInputElement);
      const before = inputs.map((i) => i.checked);
      return () => {
        // Clicking goes through the page's own handlers; a radio can only be unticked directly.
        inputs.forEach((input, i) => {
          if (input.checked !== before[i] && (field.kind === 'checkgroup' || before[i])) input.click();
        });
        inputs.forEach((input, i) => {
          if (input.checked !== before[i]) setChecked(input, before[i]);
        });
        return inputs.every((input, i) => input.checked === before[i]);
      };
    }
    case 'file': {
      const input = el as HTMLInputElement;
      const before = input.files;
      return () => {
        if (before?.length) input.files = before;
        else input.value = '';
        fire(input, 'input');
        fire(input, 'change');
        return (input.files?.length ?? 0) === (before?.length ?? 0);
      };
    }
    case 'select': {
      const select = el as HTMLSelectElement;
      const index = select.selectedIndex;
      const value = select.value;
      return () => {
        setNativeValue(select, value);
        select.selectedIndex = index;
        fire(select, 'input');
        fire(select, 'change');
        return select.selectedIndex === index;
      };
    }
    case 'combobox': {
      // The choice lives in the widget's own state, out of reach once an option was clicked.
      // Only a dropdown that still shows what it showed before counts as put back.
      const shown = () =>
        el instanceof HTMLInputElement
          ? `${el.value}|${el.closest('[class*="control"]')?.textContent ?? ''}`
          : (el.textContent ?? '');
      const before = shown();
      return () => shown() === before;
    }
    default: {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const before = el.value;
        return () => {
          setNativeValue(el, before);
          fire(el, 'input');
          fire(el, 'change');
          return el.value === before;
        };
      }
      const before = el.textContent ?? '';
      return () => {
        typeIntoEditor(el, before);
        return (el.textContent ?? '').trim() === before.trim();
      };
    }
  }
}

/** Makes these changes the ones Undo takes back. A fill that changed nothing keeps the previous record. */
export function rememberFill(changes: Change[]): void {
  if (changes.length) lastFill = changes;
}

/** Puts back every field the most recent fill changed. Fields it cannot put back stay outlined. */
export function undoLastFill(doc: Document): UndoResult {
  const result: UndoResult = { restored: 0, manual: [] };
  clearHighlights(doc);
  for (const { field, restore } of [...lastFill].reverse()) {
    if (restore()) {
      result.restored++;
    } else {
      result.manual.push({ label: field.label || field.placeholder || 'Unlabelled field' });
      highlight(field, 'attention');
    }
  }
  lastFill = [];
  return result;
}
