import type { Adapter } from './types';

export const greenhouse: Adapter = {
  name: 'Greenhouse',
  matches: (location, doc) =>
    /(^|\.)greenhouse\.io$/.test(location.hostname) ||
    Boolean(doc.querySelector('form#application_form, form#application-form')),
  hints: [
    { selector: '#first_name, [name="job_application[first_name]"]', key: 'firstName' },
    { selector: '#last_name, [name="job_application[last_name]"]', key: 'lastName' },
    { selector: '#email, [name="job_application[email]"]', key: 'email' },
    { selector: '#phone, [name="job_application[phone]"]', key: 'phone' },
    { selector: '#candidate-location, #job_application_location, [name="job_application[location]"]', key: 'location' },
    { selector: 'input[type="file"]#resume, [data-field="resume"] input[type="file"]', key: 'cv' },
    {
      selector: 'input[type="file"]#cover_letter, [data-field="cover_letter"] input[type="file"]',
      key: 'coverLetterFile',
    },
  ],
};
