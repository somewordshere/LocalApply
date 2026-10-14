import type { FieldKey, FieldKind } from '../types';

/**
 * Words for one language. Write them the way `norm()` leaves label text: lowercase,
 * accents removed (ß → ss), punctuation turned into spaces. Regex fragments are allowed
 * (`authori[sz]ed`, `gehalt\\p{L}*`); each entry must match whole words.
 */
export interface Locale {
  /** Label phrases that identify each field. */
  fields: Partial<Record<FieldKey, string[]>>;
  /** Labels that consist of exactly this text. */
  exact?: Partial<Record<FieldKey, string[]>>;
  /** Words that rule a field out even when a phrase matched ("company" next to "name"). */
  exclude?: Partial<Record<FieldKey, string[]>>;
  /** Words showing a field is about someone other than the applicant (emergency contact, referee). */
  otherPerson?: string[];
}

/** Language-independent settings of one field. Order in the list breaks ties: earlier wins. */
export interface FieldRule {
  key: FieldKey;
  /** autocomplete tokens that identify the field outright. */
  auto?: string[];
  /** Input types that imply this key when nothing else matches. */
  types?: string[];
  /** Only these kinds of control. */
  kinds?: FieldKind[];
  /** Applies to file inputs (and only to them). */
  file?: boolean;
  /** May match long question-style labels. */
  long?: boolean;
}

export interface Rule extends FieldRule {
  /** Matches whole words in normalised (lowercase, accent-free) label or attribute text. */
  re: RegExp;
  /** Normalised texts that match only when they are the entire label or attribute. */
  exact?: string[];
  not?: RegExp;
}
