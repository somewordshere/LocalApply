import type { CustomAnswer } from '../profile/schema';
import { NOT_THE_APPLICANT, RULES, YES_NO_KEYS } from './rules';
import { escapeRegex, norm, phrases } from './text';
import type { Field, FieldKey } from './types';

export interface Hint {
  selector: string;
  key: FieldKey;
}

const MAX_SHORT_LABEL = 60;

/** Maps a field to a profile key, or null when no rule is confident enough. */
const CHOICE_KINDS = new Set(['select', 'radio', 'combobox']);

export function matchField(field: Field, hints: Hint[] = []): FieldKey | null {
  // A lone checkbox is a consent or opt-in; ticking it is the applicant's decision.
  if (field.kind === 'checkbox') return null;

  for (const hint of hints) {
    if (field.el.closest(hint.selector)) return hint.key;
  }

  const label = norm(field.label);
  const attrs = field.attrs.map(norm).filter(Boolean);
  const all = [label, ...attrs].join(' | ');
  if (NOT_THE_APPLICANT.test(all)) return null;

  let best: FieldKey | null = null;
  let bestScore = 0;
  for (const rule of RULES) {
    if (Boolean(rule.file) !== (field.kind === 'file')) continue;
    if (rule.kinds && !rule.kinds.includes(field.kind)) continue;
    // "Yes" typed into a free-text box answers nothing; only pick it from offered choices.
    if (YES_NO_KEYS.has(rule.key) && !CHOICE_KINDS.has(field.kind)) continue;

    const hit = (text: string) => rule.re.test(text) || Boolean(rule.exact?.includes(text));
    let score = 0;
    if (rule.auto && field.autocomplete.some((token) => rule.auto!.includes(token))) score = 100;
    else if (label && (label.length <= MAX_SHORT_LABEL || rule.long) && hit(label)) score = 70;
    else if (attrs.some(hit)) score = 50;
    else if (rule.types?.includes(field.type)) score = 40;

    if (score && rule.not?.test(all)) score = 0;
    if (score > bestScore) {
      best = rule.key;
      bestScore = score;
    }
  }
  return best;
}

/** Returns the saved answer whose keywords appear as whole words in the field label. */
export function matchCustom(field: Field, answers: CustomAnswer[]): string | null {
  const label = norm(field.label);
  if (!label) return null;
  for (const entry of answers) {
    const keys = entry.keywords.split(',').map(norm).filter(Boolean);
    if (entry.answer && keys.some((k) => phrases([escapeRegex(k)]).test(label))) return entry.answer;
  }
  return null;
}
