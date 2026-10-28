import { host, type Adapter } from './types';

/** JOIN. Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const join: Adapter = {
  name: 'JOIN',
  matches: host(/(^|\.)join\.com$/),
  hints: [],
};
