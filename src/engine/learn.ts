import { questionKeywords, type CustomAnswer, type Profile } from '../profile/schema';
import { fillPlaceholders, withPlaceholders, type Job } from './job';
import { findCustom, matchField, type Hint } from './match';
import { fieldOf } from './scan';
import type { Field } from './types';

/** An answer the applicant typed into a question LocalApply had no answer for, ready to be saved. */
export interface Learned {
  /** The question, as the form labels it. */
  label: string;
  /** As it will be saved: the posting's employer and job title replaced with {company} and {position}. */
  answer: string;
  /** The saved answer this one replaces: the question had one, and the applicant wrote something else. */
  replaces?: string;
}

const MAX_ANSWER = 5000;
/** Only free text is learned; email, phone, number and date boxes are profile data. */
const FREE_TEXT_TYPES = new Set(['', 'text']);
/** Questions whose answer must never be kept, whatever the applicant types. */
const SENSITIVE =
  /\b(pass(word|wort|e)?|kennwort|iban|bic|swift|credit card|card number|kreditkarte|cvv|cvc|ssn|social security|sozialversicherung|tax id|steuer[- ]?id|steuernummer|passport|reisepass|ausweis|captcha|verification code|one[- ]?time|otp|pin)\b/i;

function typedText(field: Field): string {
  const el = field.el;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value;
  return el.innerText ?? el.textContent ?? '';
}

/** Everything the profile already knows as plain text: typing one of these is not a new answer. */
function profileTexts(p: Profile): Set<string> {
  const texts = Object.values(p).filter((v): v is string => typeof v === 'string');
  texts.push(`${p.firstName} ${p.lastName}`);
  return new Set(texts.map((v) => v.trim().toLowerCase()).filter((v) => v.length > 1));
}

/**
 * What the applicant typed into this control, as an answer worth saving; null when there is nothing to
 * learn: not free text, a profile field, a sensitive question, empty, or the same as the saved answer.
 */
export function learnFrom(
  target: Element,
  profile: Profile,
  options: { hints?: Hint[]; job?: Job } = {},
): Learned | null {
  const field = fieldOf(target);
  if (!field || (field.kind !== 'text' && field.kind !== 'textarea') || !FREE_TEXT_TYPES.has(field.type)) return null;
  const label = field.label;
  if (!/\p{L}{3}/u.test(label) || SENSITIVE.test(label)) return null;
  // "one-time-code", "cc-number" and the like; "on" and "off" say nothing about the field.
  if (field.autocomplete.some((token) => token !== 'on' && token !== 'off')) return null;
  // A profile field: the profile is the place to change it.
  if (matchField(field, options.hints)) return null;

  const typed = typedText(field).trim();
  if (!typed || typed.length > MAX_ANSWER || profileTexts(profile).has(typed.toLowerCase())) return null;
  const answer = withPlaceholders(typed, options.job);
  const saved = findCustom(field, profile.customAnswers);
  if (!saved) return { label, answer };
  if (saved.answer.trim() === answer || fillPlaceholders(saved.answer, options.job)?.trim() === typed) return null;
  return { label, answer, replaces: saved.id };
}

/** crypto.randomUUID needs a secure context, which a page served over http is not. */
function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** The profile with the chosen answers saved: new questions added, changed answers replacing the old ones. */
export function saveLearned(profile: Profile, picked: Learned[]): Profile {
  const replacing = new Map(picked.filter((l) => l.replaces).map((l) => [l.replaces!, l.answer]));
  const customAnswers: CustomAnswer[] = profile.customAnswers.map((a) =>
    replacing.has(a.id) ? { ...a, answer: replacing.get(a.id)! } : a,
  );
  for (const l of picked) {
    if (!l.replaces) customAnswers.push({ id: newId(), keywords: questionKeywords(l.label), answer: l.answer });
  }
  return { ...profile, customAnswers };
}
