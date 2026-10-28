import { host, type Adapter } from './types';

/** Workable's application form. Field names from its form markup, not yet tried on a live posting. */
export const workable: Adapter = {
  name: 'Workable',
  matches: host(/(^|\.)workable\.com$/),
  hints: [
    { selector: '[name="firstname"]', key: 'firstName' },
    { selector: '[name="lastname"]', key: 'lastName' },
    { selector: '[name="email"]', key: 'email' },
    { selector: '[name="phone"]', key: 'phone' },
    { selector: '[name="cover_letter"]', key: 'coverLetterText' },
  ],
};
