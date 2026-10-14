import { host, type Adapter } from './types';

export const ashby: Adapter = {
  name: 'Ashby',
  matches: host(/(^|\.)ashbyhq\.com$/),
  hints: [
    { selector: '[id="_systemfield_name"], [name="_systemfield_name"]', key: 'fullName' },
    { selector: '[id="_systemfield_email"], [name="_systemfield_email"]', key: 'email' },
    { selector: 'input[type="file"][id="_systemfield_resume"]', key: 'cv' },
  ],
};
