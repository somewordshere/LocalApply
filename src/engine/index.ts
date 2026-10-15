import { pickAdapter } from '../adapters';
import type { Profile } from '../profile/schema';
import { attachFile, DIAL_CODE_ONLY, fillField, formatDate, hasValue } from './fill';
import { matchCustom, matchField } from './match';
import { clearHighlights, highlight } from './report';
import { resolve } from './resolve';
import { DATE_KEYS } from './rules';
import { scan } from './scan';
import type { Field, FieldKey, FillResult } from './types';
import { remember, rememberFill, type Change } from './undo';

export interface FillOptions {
  /** Replace values that are already present. */
  overwrite?: boolean;
  location?: { hostname: string; pathname: string };
}

const DIGITS_ONLY_HINT =
  /numeric only|numbers only|digits only|nur (ziffern|zahl(en)?)|uniquement des chiffres|solo n[uú]meros/i;
const CURRENCY_HINT = /[€$£]|\b(eur|euro|usd|gbp|chf|pln)\b/i;

/** A form with at least this many recognised fields is taken to be the application. */
const APPLICATION_FORM_MIN = 3;

function isNumeric(field: Field): boolean {
  const mode = field.el.getAttribute('inputmode');
  return field.type === 'number' || mode === 'numeric' || mode === 'decimal' || DIGITS_ONLY_HINT.test(field.label);
}

/** Fills every recognised field in the document. Never clicks submit or navigation buttons. */
export async function fillPage(doc: Document, profile: Profile, options: FillOptions = {}): Promise<FillResult> {
  const location = options.location ?? doc.location ?? { hostname: '', pathname: '' };
  const adapter = pickAdapter(location, doc);
  const root = adapter?.scope?.(doc) ?? doc;

  clearHighlights(doc);
  let fields = scan(root);
  const keys = new Map<Field, FieldKey | null>();
  for (const field of fields) keys.set(field, matchField(field, adapter?.hints));

  // Newsletter and contact forms share the page with the application; leave them alone.
  // Uploads stay: some job sites put the CV upload in a form of its own.
  const formOf = (field: Field) => field.el.closest('form');
  const matchedPerForm = new Map<Element | null, number>();
  for (const field of fields) {
    if (keys.get(field)) matchedPerForm.set(formOf(field), (matchedPerForm.get(formOf(field)) ?? 0) + 1);
  }
  if (Math.max(0, ...matchedPerForm.values()) >= APPLICATION_FORM_MIN) {
    fields = fields.filter((field) => {
      const form = formOf(field);
      return form === null || field.kind === 'file' || (matchedPerForm.get(form) ?? 0) > 1;
    });
  }

  // A lone unlabeled upload on an application form is almost always the CV.
  if (!fields.some((f) => keys.get(f) === 'cv')) {
    const uploads = fields.filter((f) => f.kind === 'file' && !keys.get(f));
    if (uploads.length === 1) keys.set(uploads[0], 'cv');
  }

  const present = new Set(fields.map((f) => keys.get(f)).filter((k): k is FieldKey => Boolean(k)));
  const result: FillResult = {
    adapter: adapter?.name ?? null,
    total: fields.length,
    filled: [],
    missing: [],
    unmatched: [],
    skipped: 0,
  };
  const changes: Change[] = [];

  for (const field of fields) {
    const key = keys.get(field) ?? null;
    // Phone country pickers show a preselected country; like a prefilled dial code, that is not an answer yet.
    const presetPicker = key === 'phoneCountryCode' && field.kind === 'combobox';
    if (!options.overwrite && !presetPicker && hasValue(field)) {
      result.skipped++;
      continue;
    }
    const label = field.label || field.placeholder;
    const flagUnmatched = () => {
      // Optional consent boxes and controls nobody labelled are not worth the applicant's attention.
      if (!label || (field.kind === 'checkbox' && !field.required)) return;
      result.unmatched.push({ label, required: field.required });
      if (field.required) highlight(field, 'attention');
    };

    if (!key) {
      const answer =
        field.kind === 'file' || field.kind === 'checkbox' ? null : matchCustom(field, profile.customAnswers);
      const restore = remember(field);
      if (answer && (await fillField(field, [answer]))) {
        changes.push({ field, restore });
        result.filled.push({ label, key: 'custom answer' });
        highlight(field, 'filled');
      } else {
        flagUnmatched();
      }
      continue;
    }

    // A phone box prefilled with "+49" wants the full international number even beside a country picker.
    const dialCodePrefilled =
      key === 'phone' &&
      DIAL_CODE_ONLY.test((field.el as HTMLInputElement).value ?? '') &&
      (field.el as HTMLInputElement).value.includes('+');
    let candidates = resolve(key, profile, {
      has: (k) => present.has(k) && !(k === 'phoneCountryCode' && dialCodePrefilled),
      numeric: isNumeric(field) || (key === 'salary' && CURRENCY_HINT.test(field.label)),
    });
    if (!candidates.length) {
      result.missing.push({ label: label || key, key });
      if (field.required) highlight(field, 'attention');
      continue;
    }
    if (DATE_KEYS.has(key) && (field.kind === 'text' || field.kind === 'date')) {
      candidates = [formatDate(candidates[0], field)];
    }

    const restore = remember(field);
    let done: boolean;
    if (field.kind === 'file') {
      const stored = key === 'coverLetterFile' ? profile.coverLetterFile : profile.cv;
      done = stored ? attachFile(field.el as HTMLInputElement, stored) : false;
    } else {
      done = await fillField(field, candidates);
    }

    if (done) {
      changes.push({ field, restore });
      result.filled.push({ label: label || key, key });
      highlight(field, 'filled');
    } else {
      flagUnmatched();
    }
  }

  rememberFill(changes);
  return result;
}

export type { FillResult } from './types';
export { undoLastFill, type UndoResult } from './undo';
