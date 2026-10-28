import { host, type Adapter } from './types';

/** iCIMS, often inside an embedded frame. Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const icims: Adapter = {
  name: 'iCIMS',
  matches: host(/(^|\.)icims\.com$/),
  hints: [],
};
