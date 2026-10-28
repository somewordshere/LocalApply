import { host, type Adapter } from './types';

/** d.vinci (German-speaking employers). Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const dvinci: Adapter = {
  name: 'd.vinci',
  matches: host(/(^|\.)dvinci(-hr|-easy)?\.(com|de)$/),
  hints: [],
};
