import { host, type Adapter } from './types';

/** rexx systems recruiting (German-speaking employers). Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const rexx: Adapter = {
  name: 'rexx systems',
  matches: host(/(^|\.)rexx-(systems|recruitment)\.com$/),
  hints: [],
};
