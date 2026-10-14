import { beforeEach, describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { profile, PHONE, load, value, named, only } from './helpers';

describe('site adapters', () => {
  beforeEach(() => load('ats.html'));

  it('Greenhouse', async () => {
    only('greenhouse');
    const result = await fillPage(document, profile, {
      location: { hostname: 'boards.greenhouse.io', pathname: '/acme/jobs/1' },
    });
    expect(result.adapter).toBe('Greenhouse');
    expect(value('first_name')).toBe('Max');
    expect(value('last_name')).toBe('Muster');
    expect(value('email')).toBe('max@example.com');
    expect(value('phone')).toBe(PHONE);
    expect(value('q1')).toBe(profile.linkedin);
    expect(result.missing.map((m) => m.key).sort()).toEqual(['coverLetterFile', 'cv']);
  });

  it('Lever', async () => {
    only('lever');
    const result = await fillPage(document, profile, {
      location: { hostname: 'jobs.lever.co', pathname: '/acme/1/apply' },
    });
    expect(result.adapter).toBe('Lever');
    expect(named('name').value).toBe('Max Muster');
    expect(named('email').value).toBe('max@example.com');
    expect(named('phone').value).toBe(PHONE);
    expect(named('org').value).toBe('Acme GmbH');
    expect(named('urls[LinkedIn]').value).toBe(profile.linkedin);
    expect(named('urls[GitHub]').value).toBe(profile.github);
    expect(named('urls[Portfolio]').value).toBe(profile.website);
    expect(named('comments').value).toBe('Dear hiring team');
  });

  it('Workday', async () => {
    only('workday');
    const result = await fillPage(document, profile, {
      location: { hostname: 'acme.wd5.myworkdayjobs.com', pathname: '/x' },
    });
    expect(result.adapter).toBe('Workday');
    expect(value('name--legalName--firstName')).toBe('Max');
    expect(value('name--legalName--lastName')).toBe('Muster');
    expect(value('address--addressLine1')).toBe('Hauptstr. 5');
    expect(value('address--city')).toBe('Berlin');
    expect(value('address--postalCode')).toBe('10115');
    expect(value('phoneNumber--phoneNumber')).toBe(PHONE);
  });

  it('Ashby', async () => {
    only('ashby');
    await fillPage(document, profile, { location: { hostname: 'jobs.ashbyhq.com', pathname: '/acme/1' } });
    expect(value('_systemfield_name')).toBe('Max Muster');
    expect(value('_systemfield_email')).toBe('max@example.com');
  });

  it('Personio', async () => {
    only('personio');
    const result = await fillPage(document, profile, {
      location: { hostname: 'acme.jobs.personio.de', pathname: '/job/1' },
    });
    expect(result.adapter).toBe('Personio');
    expect(named('first_name').value).toBe('Max');
    expect(named('last_name').value).toBe('Muster');
    expect(named('available_from').value).toBe('2027-01-01');
    expect(named('salary_expectations').value).toBe('65000 EUR');
  });
});
