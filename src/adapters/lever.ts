import { host, type Adapter } from './types';

export const lever: Adapter = {
  name: 'Lever',
  matches: host(/(^|\.)lever\.co$/),
  hints: [
    { selector: 'input[name="name"]', key: 'fullName' },
    { selector: 'input[name="email"]', key: 'email' },
    { selector: 'input[name="phone"]', key: 'phone' },
    { selector: 'input[name="org"]', key: 'currentEmployer' },
    { selector: 'input[name="location"]', key: 'location' },
    { selector: 'input[name="urls[LinkedIn]"]', key: 'linkedin' },
    { selector: 'input[name="urls[GitHub]"]', key: 'github' },
    { selector: 'input[name="urls[Portfolio]"], input[name="urls[Other]"]', key: 'website' },
    { selector: 'input[type="file"][name="resume"]', key: 'cv' },
    { selector: 'textarea[name="comments"]', key: 'coverLetterText' },
  ],
};
