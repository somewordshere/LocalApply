import { host, type Adapter } from './types';

export const successfactors: Adapter = {
  name: 'SuccessFactors',
  matches: host(/(^|\.)(successfactors\.(com|eu)|sapsf\.(com|eu))$/),
  hints: [
    { selector: '[name="firstName"]', key: 'firstName' },
    { selector: '[name="lastName"]', key: 'lastName' },
    { selector: '[name="contactEmail"]', key: 'email' },
    { selector: '[name="cellPhone"]', key: 'phone' },
    { selector: '[name="zip"]', key: 'postcode' },
  ],
};
