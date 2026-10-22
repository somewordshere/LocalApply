import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { matchField } from '../../src/engine/match';
import { scan } from '../../src/engine/scan';
import { emptyEducation, emptyWork } from '../../src/profile/schema';
import { nowhere, profile, value } from './helpers';

const checked = (name: string) =>
  (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value;

describe('driving licence, travel and salary range', () => {
  const keysOf = () => scan(document).map((f) => matchField(f));

  it('answers a licence yes/no question, and gives the classes to a class question or a text box', async () => {
    document.body.innerHTML = `
      <fieldset><legend>Do you have a valid driver's license?</legend>
        <label><input type="radio" name="dl" value="y" /> Yes</label>
        <label><input type="radio" name="dl" value="n" /> No</label>
      </fieldset>
      <label for="c">Driving licence class</label>
      <select id="c"><option value="">Select</option><option>A</option><option>B</option><option>C</option></select>
      <label for="f">Führerschein</label><input id="f" />`;
    // Radio groups are listed after the other fields.
    expect(keysOf()).toEqual(['drivingLicenceClass', 'drivingLicenceClass', 'drivingLicence']);
    await fillPage(
      document,
      { ...profile, drivingLicence: 'yes', drivingLicenceClass: 'B, BE' },
      { location: nowhere },
    );
    expect(checked('dl')).toBe('y');
    expect(value('c')).toBe('B');
    expect(value('f')).toBe('B, BE');
  });

  it('answers travel questions in German and English', async () => {
    document.body.innerHTML = `
      <label for="r">Reisebereitschaft</label>
      <select id="r"><option value="">Bitte wählen</option><option value="1">Ja</option><option value="0">Nein</option></select>
      <fieldset><legend>Are you willing to travel up to 30% of the time?</legend>
        <label><input type="radio" name="t" value="y" /> Yes</label>
        <label><input type="radio" name="t" value="n" /> No</label>
      </fieldset>`;
    expect(keysOf()).toEqual(['willingToTravel', 'willingToTravel']);
    await fillPage(document, { ...profile, willingToTravel: 'no' }, { location: nowhere });
    expect(value('r')).toBe('0');
    expect(checked('t')).toBe('n');
  });

  it('fills both ends of a salary range, each falling back to the expectation', async () => {
    document.body.innerHTML = `
      <label for="s">Salary expectation</label><input id="s" type="number" />
      <label for="lo">Minimum salary</label><input id="lo" type="number" />
      <label for="hi">Maximum salary</label><input id="hi" type="number" />
      <label for="von">Gehalt von</label><input id="von" type="number" />
      <label for="bis">Gehalt bis</label><input id="bis" type="number" />`;
    expect(keysOf()).toEqual(['salary', 'salaryMin', 'salaryMax', 'salaryMin', 'salaryMax']);
    await fillPage(document, { ...profile, salaryMax: '80000' }, { location: nowhere });
    expect(['s', 'lo', 'hi', 'von', 'bis'].map(value)).toEqual(['65000', '65000', '80000', '65000', '80000']);
  });

  it('leaves the licence alone when the profile has no answer', async () => {
    document.body.innerHTML = `
      <label for="c">Licence category</label><select id="c"><option value="">Select</option><option>B</option></select>`;
    const result = await fillPage(document, profile, { location: nowhere });
    expect(value('c')).toBe('');
    expect(result.missing.map((m) => m.key)).toEqual(['drivingLicenceClass']);
  });
});

describe('spoken languages', () => {
  const keysOf = () => scan(document).map((f) => matchField(f));
  const speaker = {
    ...profile,
    languages: [
      { id: '1', language: 'Deutsch', level: 'C1' as const },
      { id: '2', language: 'English', level: 'native' as const },
    ],
  };

  it('writes the list into a "Languages" box', async () => {
    document.body.innerHTML = '<label for="l">Languages</label><input id="l" />';
    expect(keysOf()).toEqual(['languages']);
    await fillPage(document, speaker, { location: nowhere });
    expect(value('l')).toBe('Deutsch (C1), English (native)');
  });

  it("answers a question about one language with that language's level, whatever language the form is in", async () => {
    document.body.innerHTML = `
      <label for="de">Deutschkenntnisse</label>
      <select id="de"><option value="">Bitte wählen</option><option>Grundkenntnisse</option><option>Gut</option><option>Verhandlungssicher</option><option>Muttersprache</option></select>
      <label for="en">What is your level of proficiency in English?</label>
      <select id="en"><option value="">Select</option><option>Elementary proficiency</option><option>Professional working proficiency</option><option>Full professional proficiency</option><option>Native or bilingual proficiency</option></select>
      <label for="fr">Niveau d'allemand</label>
      <select id="fr"><option value="">Choisir</option><option>A1</option><option>B2</option><option>C1</option><option>C2</option></select>`;
    expect(keysOf()).toEqual(['languageLevel', 'languageLevel', 'languageLevel']);
    await fillPage(document, speaker, { location: nowhere });
    expect(['de', 'en', 'fr'].map(value)).toEqual(['Verhandlungssicher', 'Native or bilingual proficiency', 'C1']);
  });

  it('gives unnamed language questions the languages in order, and leaves skill questions alone', async () => {
    document.body.innerHTML = `
      <label for="a">Language level</label>
      <select id="a"><option value="">-</option><option>B2</option><option>C1</option><option>Native</option></select>
      <label for="b">Language level</label>
      <select id="b"><option value="">-</option><option>B2</option><option>C1</option><option>Native</option></select>
      <label for="x">Excel proficiency</label>
      <select id="x"><option value="">-</option><option>Basic</option><option>Advanced</option></select>`;
    expect(keysOf()).toEqual(['languageLevel', 'languageLevel', null]);
    await fillPage(document, speaker, { location: nowhere });
    expect(['a', 'b', 'x'].map(value)).toEqual(['C1', 'Native', '']);
  });
});

describe('work history and education on ordinary forms', () => {
  const keysOf = () => scan(document).map((f) => matchField(f));
  const person = {
    ...profile,
    startDate: '2027-01-01',
    experience: [
      { ...emptyWork('w1'), title: 'QA Engineer', employer: 'Brightline', start: '2021-03', current: true },
      { ...emptyWork('w2'), title: 'Tester', employer: 'Acme', start: '2018-09', end: '2021-02' },
    ],
    education: [{ ...emptyEducation('e1'), school: 'TU Berlin', start: '2015-10', end: '2017-09' }],
  };

  it('keeps employment dates apart from the availability date, in the format each box shows', async () => {
    document.body.innerHTML = `
      <label for="avail">Earliest start date</label><input id="avail" placeholder="DD/MM/YYYY" />
      <label for="s">Employment start date</label><input id="s" placeholder="MM/YYYY" />
      <label for="m">Beschäftigt seit</label><input id="m" type="month" />
      <label for="g">Graduation date</label><input id="g" placeholder="YYYY-MM" />
      <label for="y">Graduation year</label>
      <select id="y"><option value="">-</option><option>2016</option><option>2017</option><option>2018</option><option>2019</option></select>`;
    expect(keysOf()).toEqual(['startDate', 'workStart', 'workStart', 'educationEnd', 'educationEndYear']);
    await fillPage(document, person, { location: nowhere });
    expect(['avail', 's', 'm', 'g', 'y'].map(value)).toEqual(['01/01/2027', '03/2021', '2018-09', '2017-09', '2017']);
  });

  it('names the month for a month dropdown, and leaves the end of a current job empty', async () => {
    document.body.innerHTML = `
      <label for="e">Employment end date (month)</label>
      <select id="e"><option value="">Month</option><option>January</option><option>February</option><option>March</option></select>
      <label for="e2">Employment end date (month)</label>
      <select id="e2"><option value="">Month</option><option>January</option><option>February</option><option>March</option></select>`;
    await fillPage(document, person, { location: nowhere });
    expect([value('e'), value('e2')]).toEqual(['', 'February']);
  });

  it('gives the second "Current employer"-style field the second job', async () => {
    document.body.innerHTML = `
      <label for="a">Employer</label><input id="a" /><label for="b">Job title</label><input id="b" />
      <label for="c">Employer</label><input id="c" /><label for="d">Job title</label><input id="d" />`;
    await fillPage(document, person, { location: nowhere });
    expect(['a', 'b', 'c', 'd'].map(value)).toEqual(['Brightline', 'QA Engineer', 'Acme', 'Tester']);
  });
});
