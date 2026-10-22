import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { fillPlaceholders, readJob } from '../../src/engine/job';
import { nowhere, profile, value } from './helpers';

const page = (title: string, body: string) => {
  document.head.innerHTML = '';
  document.title = title;
  document.body.innerHTML = body;
};

describe('reading the posting from the page', () => {
  it('prefers schema.org JobPosting, inside @graph and with several types', () => {
    page(
      'Careers',
      `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":["JobPosting"],"title":"QA Engineer","hiringOrganization":{"@type":"Organization","name":"Acme GmbH"}}]}</script>
       <script type="application/ld+json">{ not json</script><h1>Something else</h1>`,
    );
    expect(readJob(document)).toEqual({ position: 'QA Engineer', company: 'Acme GmbH' });
  });

  it('reads "Job Application for … at …" titles', () => {
    page('Job Application for Senior QA Engineer at Northwind Labs', '<h1>Senior QA Engineer</h1>');
    expect(readJob(document)).toEqual({ position: 'Senior QA Engineer', company: 'Northwind Labs' });
  });

  it('splits titles on separators, takes the part matching the heading as the job, and skips job-board names', () => {
    page('Northwind Labs - Senior QA Engineer | Lever', '<h1>Senior QA Engineer</h1>');
    expect(readJob(document)).toEqual({ position: 'Senior QA Engineer', company: 'Northwind Labs' });
    page('Softwaretester (m/w/d) · Weber Sensorik', '<h1>Softwaretester (m/w/d)</h1>');
    expect(readJob(document)).toEqual({ position: 'Softwaretester (m/w/d)', company: 'Weber Sensorik' });
  });

  it('falls back to the heading for the job, and never takes a job board for the employer', () => {
    page('Apply', '<h1>Data Analyst</h1>');
    document.head.innerHTML = '<meta property="og:site_name" content="Greenhouse">';
    expect(readJob(document)).toEqual({ position: 'Data Analyst', company: undefined });
  });
});

describe('placeholders', () => {
  const job = { company: 'Acme', position: 'QA Engineer' };

  it('replaces {company} and {position} and their other names', () => {
    expect(fillPlaceholders('Dear {company} team, I am applying for {position}.', job)).toBe(
      'Dear Acme team, I am applying for QA Engineer.',
    );
    expect(fillPlaceholders('{ Employer } / {role} / {JOB} / {title}', job)).toBe(
      'Acme / QA Engineer / QA Engineer / QA Engineer',
    );
    expect(fillPlaceholders('No placeholders {here}', undefined)).toBe('No placeholders {here}');
  });

  it('gives up when the page did not say', () => {
    expect(fillPlaceholders('Dear {company} team', { position: 'QA Engineer' })).toBeNull();
  });

  it('fills the cover letter and saved answers with the posting, and leaves them open without it', async () => {
    const body = `
      <label for="cl">Cover letter</label><textarea id="cl"></textarea>
      <label for="why">Why do you want to join us?</label><input id="why" />`;
    const person = {
      ...profile,
      coverLetterText: 'Dear {company} team, I would love to work as your {position}.',
      customAnswers: [{ id: '1', keywords: 'why do you want to join', answer: 'I admire {company}.' }],
    };
    page('Apply', body);
    await fillPage(document, person, { location: nowhere, job });
    expect(value('cl')).toBe('Dear Acme team, I would love to work as your QA Engineer.');
    expect(value('why')).toBe('I admire Acme.');

    page('Apply', body);
    const result = await fillPage(document, person, { location: nowhere });
    expect([value('cl'), value('why')]).toEqual(['', '']);
    expect(result.missing.map((m) => m.key)).toEqual(['coverLetterText']);
    expect(result.unmatched.map((u) => u.label)).toEqual(['Why do you want to join us?']);
  });
});
