import { host, type Adapter } from './types';

/**
 * Oracle Taleo. Its personal-information fields have long generated ids ending in the field's name
 * ("…personal_info_FirstName"). Taken from Taleo's markup, not yet tried on a live posting.
 */
const field = (name: string) => `[id$="_${name}"]`;

export const taleo: Adapter = {
  name: 'Taleo',
  matches: host(/(^|\.)taleo\.net$/),
  hints: [
    { selector: field('FirstName'), key: 'firstName' },
    { selector: field('LastName'), key: 'lastName' },
    { selector: field('EmailAddress'), key: 'email' },
    { selector: `${field('MobilePhone')}, ${field('HomePhone')}`, key: 'phone' },
    { selector: field('Address'), key: 'street' },
    { selector: field('City'), key: 'city' },
    { selector: field('ZipCode'), key: 'postcode' },
  ],
};
