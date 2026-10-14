import { host, type Adapter } from './types';

export const personio: Adapter = {
  name: 'Personio',
  matches: host(/\.jobs\.personio\.(de|com)$/),
  hints: [
    { selector: '[name="first_name"]', key: 'firstName' },
    { selector: '[name="last_name"]', key: 'lastName' },
    { selector: '[name="email"]', key: 'email' },
    { selector: '[name="phone"]', key: 'phone' },
    { selector: '[name="available_from"]', key: 'startDate' },
    { selector: '[name="salary_expectations"]', key: 'salary' },
  ],
};
