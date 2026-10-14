import { host, type Adapter } from './types';

export const smartrecruiters: Adapter = {
  name: 'SmartRecruiters',
  matches: host(/(^|\.)smartrecruiters\.com$/),
  hints: [
    { selector: '#first-name-input', key: 'firstName' },
    { selector: '#last-name-input', key: 'lastName' },
    { selector: '#email-input, #confirm-email-input', key: 'email' },
    { selector: '#linkedin-input', key: 'linkedin' },
    { selector: '#website-input', key: 'website' },
  ],
};
