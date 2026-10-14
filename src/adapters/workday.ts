import { host, type Adapter } from './types';

export const workday: Adapter = {
  name: 'Workday',
  matches: host(/(^|\.)(myworkdayjobs|myworkdaysite|workday)\.com$/),
  hints: [
    { selector: '[data-automation-id="legalNameSection_firstName"], [id$="--firstName"]', key: 'firstName' },
    { selector: '[data-automation-id="legalNameSection_lastName"], [id$="--lastName"]', key: 'lastName' },
    { selector: '[data-automation-id="addressSection_addressLine1"], [id$="--addressLine1"]', key: 'street' },
    { selector: '[data-automation-id="addressSection_city"], [id$="--city"]', key: 'city' },
    { selector: '[data-automation-id="addressSection_postalCode"], [id$="--postalCode"]', key: 'postcode' },
    { selector: '[data-automation-id="addressSection_countryRegion"], [id$="--countryRegion"]', key: 'state' },
    { selector: '[data-automation-id="countryDropdown"], [id$="--country"]', key: 'country' },
    { selector: '[data-automation-id="phone-number"], [id$="--phoneNumber"]', key: 'phone' },
    { selector: '[data-automation-id="country-phone-code"], [id$="--countryPhoneCode"]', key: 'phoneCountryCode' },
    { selector: '[data-automation-id="email"]', key: 'email' },
    { selector: '[data-automation-id="file-upload-input-ref"]', key: 'cv' },
  ],
};
