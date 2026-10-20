/** A message whose wording depends on a count, one form per plural category of the language. */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type Message = string | Plural;
