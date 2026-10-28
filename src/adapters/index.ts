import { ashby } from './ashby';
import { dvinci } from './dvinci';
import { greenhouse } from './greenhouse';
import { icims } from './icims';
import { join } from './join';
import { lever } from './lever';
import { linkedin } from './linkedin';
import { personio } from './personio';
import { rexx } from './rexx';
import { smartrecruiters } from './smartrecruiters';
import { softgarden } from './softgarden';
import { successfactors } from './successfactors';
import { taleo } from './taleo';
import type { Adapter, PageLocation } from './types';
import { umantis } from './umantis';
import { workable } from './workable';
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
  workable,
  icims,
  taleo,
  softgarden,
  dvinci,
  rexx,
  umantis,
  join,
];

export function pickAdapter(location: PageLocation, doc: Document): Adapter | null {
  return ADAPTERS.find((adapter) => adapter.matches(location, doc)) ?? null;
}
