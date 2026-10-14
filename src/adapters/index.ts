import { ashby } from './ashby';
import { greenhouse } from './greenhouse';
import { lever } from './lever';
import { linkedin } from './linkedin';
import { personio } from './personio';
import { smartrecruiters } from './smartrecruiters';
import { successfactors } from './successfactors';
import type { Adapter, PageLocation } from './types';
import { workday } from './workday';

export type { Adapter, PageLocation } from './types';

/**
 * Site-specific knowledge, checked in this order. Selectors come from each system's form
 * markup and may drift when a vendor ships a redesign; unmatched fields fall back to the
 * generic rules. To support a new site, add a file like ./lever.ts and list it here.
 */
export const ADAPTERS: Adapter[] = [
  workday,
  greenhouse,
  lever,
  ashby,
  personio,
  smartrecruiters,
  successfactors,
  linkedin,
];

export function pickAdapter(location: PageLocation, doc: Document): Adapter | null {
  return ADAPTERS.find((adapter) => adapter.matches(location, doc)) ?? null;
}
