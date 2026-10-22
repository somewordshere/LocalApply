import { host, type Adapter } from './types';

/**
 * Repeating "My Experience" blocks. Workday labels their dates only "From" and "To", in a month box and a
 * year box, so these fields are known by their automation ids. Taken from Workday's markup as documented,
 * not yet tried on a live posting.
 */
const JOB = '[data-automation-id*="workExperience"]';
const STUDY = '[data-automation-id*="education"]';
const datePart = (block: string, field: string, part: 'Month' | 'Year') =>
  `${block} [data-automation-id="formField-${field}"] [data-automation-id="dateSection${part}-input"]`;

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
    { selector: `${JOB} [data-automation-id="formField-jobTitle"]`, key: 'currentTitle' },
    { selector: `${JOB} [data-automation-id="formField-companyName"]`, key: 'currentEmployer' },
    { selector: `${JOB} [data-automation-id="formField-location"]`, key: 'workLocation' },
    { selector: `${JOB} [data-automation-id="formField-roleDescription"]`, key: 'workDescription' },
    { selector: datePart(JOB, 'startDate', 'Month'), key: 'workStart' },
    { selector: datePart(JOB, 'startDate', 'Year'), key: 'workStartYear' },
    { selector: datePart(JOB, 'endDate', 'Month'), key: 'workEnd' },
    { selector: datePart(JOB, 'endDate', 'Year'), key: 'workEndYear' },
    {
      selector: `${STUDY} [data-automation-id="formField-schoolName"], ${STUDY} [data-automation-id="formField-school"]`,
      key: 'school',
    },
    { selector: `${STUDY} [data-automation-id="formField-degree"]`, key: 'degree' },
    { selector: `${STUDY} [data-automation-id="formField-fieldOfStudy"]`, key: 'fieldOfStudy' },
    { selector: `${STUDY} [data-automation-id="formField-firstYearAttended"]`, key: 'educationStartYear' },
    { selector: `${STUDY} [data-automation-id="formField-lastYearAttended"]`, key: 'educationEndYear' },
  ],
};
