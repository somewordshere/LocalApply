import { host, type Adapter } from './types';

/** Umantis (Haufe), common in Switzerland and Germany. Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const umantis: Adapter = {
  name: 'Umantis',
  matches: host(/(^|\.)umantis\.com$/),
  hints: [],
};
