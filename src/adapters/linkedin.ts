import { host, type Adapter } from './types';

const EASY_APPLY_MODAL =
  '.jobs-easy-apply-modal, .jobs-easy-apply-content, [role="dialog"][aria-labelledby*="easy-apply"]';

export const linkedin: Adapter = {
  name: 'LinkedIn',
  matches: host(/(^|\.)linkedin\.com$/),
  hints: [
    { selector: '[id*="phoneNumber-nationalNumber"]', key: 'phone' },
    { selector: '[id*="phoneNumber-country"]', key: 'phoneCountryCode' },
  ],
  scope: (doc) => doc.querySelector(EASY_APPLY_MODAL),
  ready: (doc) => Boolean(doc.querySelector(EASY_APPLY_MODAL)),
};
