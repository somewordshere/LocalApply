import { host, type Adapter } from './types';

/** softgarden (German-speaking employers). Recognised by address; its fields are filled by the generic rules, which read their labels. */
export const softgarden: Adapter = {
  name: 'softgarden',
  matches: host(/(^|\.)softgarden\.(io|de)$/),
  hints: [],
};
