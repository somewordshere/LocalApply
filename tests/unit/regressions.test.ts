import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { matchField } from '../../src/engine/match';
import { scan } from '../../src/engine/scan';
import { profile, PHONE, nowhere, value } from './helpers';

// Each case below reproduces markup that broke on a live posting.
describe('regressions from live sites', () => {
  const keysOf = () => scan(document).map((f) => matchField(f));

  it('reads a radio question from a plain label inside the fieldset (Ashby)', () => {
    document.body.innerHTML = `
      <fieldset>
        <label for="q">Are you legally authorized to work in Germany?</label>
        <div><span><input type="radio" id="q-0" name="q" /></span><label for="q-0">Yes</label></div>
        <div><span><input type="radio" id="q-1" name="q" /></span><label for="q-1">No</label></div>
      </fieldset>`;
    const [field] = scan(document);
    expect(field.label).toBe('Are you legally authorized to work in Germany?');
    expect(matchField(field)).toBe('workAuthorized');
  });

  it('treats same-named checkboxes as one question and never ticks them by yes/no rules (Recruitee)', async () => {
    document.body.innerHTML = `
      <div><p>Which visa do you hold? *</p>
        <label><input type="checkbox" name="visa" value="a" /> Student Visa</label>
        <label><input type="checkbox" name="visa" value="b" /> Work Visa</label>
      </div>
      <label><input type="checkbox" name="legal" /> Disclaimer: I confirm my visa status is correct</label>`;
    const fields = scan(document);
    expect(fields.map((f) => f.kind)).toEqual(['checkgroup', 'checkbox']);
    expect(fields[0].label).toBe('Which visa do you hold? *');
    const result = await fillPage(document, { ...profile, needsSponsorship: 'yes' }, { location: nowhere });
    expect(document.querySelectorAll('input:checked').length).toBe(0);
    expect(result.filled).toEqual([]);
    expect(result.unmatched).toEqual([{ label: 'Which visa do you hold? *', required: true }]);
  });

  it('ticks a checkbox option through a saved answer', async () => {
    document.body.innerHTML = `
      <fieldset><legend>Preferred office</legend>
        <label><input type="checkbox" name="loc[]" value="1" /> Berlin, Germany</label>
        <label><input type="checkbox" name="loc[]" value="2" /> Munich, Germany</label>
      </fieldset>`;
    const answers = [{ id: '1', keywords: 'preferred office', answer: 'Munich, Germany' }];
    await fillPage(document, { ...profile, customAnswers: answers }, { location: nowhere });
    expect([...document.querySelectorAll<HTMLInputElement>('input:checked')].map((i) => i.value)).toEqual(['2']);
  });

  it('does not type yes/no into free-text boxes', async () => {
    document.body.innerHTML =
      '<label for="t">Please share specifics regarding your right to work</label><textarea id="t"></textarea>';
    await fillPage(document, profile, { location: nowhere });
    expect(value('t')).toBe('');
  });

  it('fills the application form but not a newsletter form on the same page (HubSpot)', async () => {
    document.body.innerHTML = `
      <form><label>First name <input id="f" /></label><label>Last name <input id="l" /></label><label>Email <input id="e" /></label></form>
      <form><label>Business Email <input id="n" /></label></form>`;
    await fillPage(document, profile, { location: nowhere });
    expect(value('e')).toBe('max@example.com');
    expect(value('n')).toBe('');
  });

  it('ignores navigation, search and cookie-dialog controls', () => {
    document.body.innerHTML = `
      <header><select aria-label="Country"><option>DE</option></select></header>
      <div id="CookiebotDialog"><input type="checkbox" name="stats" /><input type="checkbox" name="stats" /></div>
      <button aria-haspopup="listbox" aria-label="Select language, current: Deutsch"></button>
      <label>City <input /></label>`;
    expect(keysOf()).toEqual(['city']);
  });

  it('writes the full number into a phone box prefilled with a dial code', async () => {
    document.body.innerHTML = `
      <button aria-haspopup="listbox" aria-label="Select country calling code: Germany"></button>
      <label for="p">Phone number</label><input id="p" type="tel" value="+49" />`;
    expect(keysOf()).toEqual(['phoneCountryCode', 'phone']);
    const result = await fillPage(document, profile, { location: nowhere });
    expect(value('p')).toBe(PHONE);
    expect(result.filled.map((f) => f.key)).toEqual(['phoneCountryCode', 'phone']);
  });

  it('gives digits only where the label asks for them', async () => {
    document.body.innerHTML = `
      <label for="p">Phone, numeric only</label><input id="p" />
      <label for="s">Gross Annual Salary Expectation in €:</label><input id="s" />`;
    await fillPage(document, profile, { location: nowhere });
    expect(value('p')).toBe('00491512345678');
    expect(value('s')).toBe('65000');
  });

  it('puts the portfolio link into a combined website field, or GitHub when there is none', async () => {
    document.body.innerHTML = '<label for="w">Website/Portfolio/Github Link</label><input id="w" />';
    await fillPage(document, profile, { location: nowhere });
    expect(value('w')).toBe(profile.website);
    await fillPage(document, { ...profile, website: '' }, { location: nowhere, overwrite: true });
    expect(value('w')).toBe(profile.github);
  });

  it('recognises required fields marked only in the label (Personio)', () => {
    document.body.innerHTML =
      '<label for="a">Telefon* (erforderlich)</label><input id="a" /><label for="b">Xing</label><input id="b" />';
    expect(scan(document).map((f) => f.required)).toEqual([true, false]);
  });

  it('answers a "Geschlecht" dropdown that offers Herr / Frau', async () => {
    document.body.innerHTML = `
      <label for="g">Geschlecht</label>
      <select id="g"><option value="">---</option><option value="GENDER_MALE">Herr</option><option value="GENDER_FEMALE">Frau</option></select>`;
    await fillPage(document, { ...profile, gender: 'Male' }, { location: nowhere });
    expect(value('g')).toBe('GENDER_MALE');
  });

  it('understands "(nur Zahl)" and residence questions', async () => {
    document.body.innerHTML = `
      <label for="s">Gehaltswunsch p.a. (nur Zahl)</label><input id="s" />
      <label for="r">What is your current place of residence?* Required</label><input id="r" />
      <label for="x">What is the region/state/province of your place of residence?* Required</label><input id="x" />`;
    await fillPage(document, profile, { location: nowhere });
    expect(value('s')).toBe('65000');
    expect(value('r')).toBe('Berlin, Germany');
    expect(value('x')).toBe('');
  });

  it('keeps script text out of labels', () => {
    document.body.innerHTML =
      '<div><div>Upload CV<script>initDropZone();</script></div><div><input type="file" /></div></div>';
    expect(scan(document)[0].label).toBe('Upload CV');
  });

  it('picks the highest education level from radios, even with "Bachelor´s" spelled with an accent', async () => {
    document.body.innerHTML = `
      <fieldset><legend>Highest Education Level:*</legend>
        <label><input type="radio" name="edu" value="0" /> High School</label>
        <label><input type="radio" name="edu" value="1" /> Associate Degree</label>
        <label><input type="radio" name="edu" value="2" /> Bachelor´s Degree</label>
        <label><input type="radio" name="edu" value="3" /> Master's Degree</label>
        <label><input type="radio" name="edu" value="4" /> MBA</label>
        <label><input type="radio" name="edu" value="5" /> PhD</label>
        <label><input type="radio" name="edu" value="6" /> Bootcamp / Technical Certification</label>
        <label><input type="radio" name="edu" value="7" /> Other</label>
      </fieldset>`;
    expect(keysOf()).toEqual(['educationLevel']);
    await fillPage(document, { ...profile, educationLevel: "Bachelor's degree" }, { location: nowhere });
    expect((document.querySelector('input[name="edu"]:checked') as HTMLInputElement | null)?.value).toBe('2');
  });

  it('answers education level dropdowns in other languages, and a master for an MBA', async () => {
    document.body.innerHTML = `
      <label for="b">Höchster Bildungsabschluss</label>
      <select id="b"><option value="">Bitte wählen</option><option value="1">Abitur</option><option value="2">Ausbildung</option><option value="3">Bachelor</option><option value="4">Master / Diplom</option><option value="5">Promotion</option></select>
      <label for="n">Hoogst genoten opleiding</label>
      <select id="n"><option value="">Kies</option><option value="h">HBO</option><option value="m">Master</option></select>`;
    expect(keysOf()).toEqual(['educationLevel', 'educationLevel']);
    await fillPage(document, { ...profile, educationLevel: 'MBA' }, { location: nowhere });
    expect(value('b')).toBe('4');
    expect(value('n')).toBe('m');
  });

  it('fills a "Degree" dropdown from the education level and types the free-text degree', async () => {
    document.body.innerHTML = `
      <label for="d">Degree</label>
      <select id="d"><option value="">Select</option><option value="ba">Bachelor</option><option value="ma">Master</option></select>
      <label for="t">Degree</label><input id="t" />`;
    await fillPage(
      document,
      { ...profile, educationLevel: "Master's degree", degree: 'M.Sc. Computer Science' },
      { location: nowhere },
    );
    expect(value('d')).toBe('ma');
    expect(value('t')).toBe('M.Sc. Computer Science');
  });
});
