import type { Locale } from '../types';

const ORGANISATION = ['bedrijf', 'gebruiker'];

export const nl: Locale = {
  fields: {
    coverLetterFile: ['motivatiebrief'],
    workAuthorized: ['werkvergunning'],
    willingToRelocate: ['verhuiz\\p{L}*'],
    salaryCurrency: ['valuta'],
    salary: ['salaris\\p{L}*'],
    noticePeriod: ['opzegtermijn'],
    startDate: ['beschikbaar vanaf', 'beschikbaarheid', 'startdatum'],
    yearsOfExperience: ['jaren ervaring'],
    gender: ['geslacht'],
    salutation: ['aanhef'],
    coverLetterText: ['motivatiebrief'],
    fullName: ['volledige naam'],
    firstName: ['voornaam'],
    lastName: ['achternaam'],
    email: ['e ?mailadres'],
    phoneCountryCode: ['landcode'],
    phone: ['telefoon', 'telefoonnummer', 'mobiel'],
    dateOfBirth: ['geboortedatum'],
    nationality: ['nationaliteit'],
    houseNumber: ['huisnummer'],
    postcode: ['postcode'],
    city: ['stad', 'woonplaats', 'plaats'],
    state: ['provincie'],
    country: ['land'],
    street: ['straat', 'adres'],
    location: ['locatie'],
    currentTitle: ['huidige functie', 'functietitel'],
    currentEmployer: ['werkgever', 'bedrijf'],
    school: ['universiteit'],
    fieldOfStudy: ['studierichting', 'opleiding'],
  },
  exact: {
    fullName: ['naam'],
  },
  exclude: {
    fullName: ORGANISATION,
    firstName: ORGANISATION,
    lastName: ORGANISATION,
  },
};
