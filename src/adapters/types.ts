import type { Hint } from '../engine/match';

export interface PageLocation {
  hostname: string;
  pathname: string;
}

/** What LocalApply knows about one applicant-tracking system beyond the generic rules. */
export interface Adapter {
  /** Shown in the popup after a fill. */
  name: string;
  matches: (location: PageLocation, doc: Document) => boolean;
  /** Stable selectors that identify a field outright; checked before the generic rules. */
  hints: Hint[];
  /** Limits scanning to the application form when the page has unrelated inputs. */
  scope?: (doc: Document) => ParentNode | null;
  /** False while the application form is not on screen (single-page sites). */
  ready?: (doc: Document) => boolean;
}

/** Matches pages whose hostname fits the pattern. */
export const host = (pattern: RegExp) => (location: PageLocation) => pattern.test(location.hostname);
