import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { addBlocks, findAddButton } from '../../src/engine/blocks';
import { emptyWork } from '../../src/profile/schema';
import { nowhere, profile } from './helpers';

const jobs = {
  ...profile,
  experience: [
    { ...emptyWork('w1'), title: 'QA Lead', employer: 'Acme GmbH', current: true },
    { ...emptyWork('w2'), title: 'Tester', employer: 'Brightline' },
    { ...emptyWork('w3'), title: 'Intern', employer: 'Copperfield' },
  ],
};

const JOB_BLOCK = (n: number) =>
  `<div class="job"><label for="t${n}">Job title</label><input id="t${n}"><label for="e${n}">Employer</label><input id="e${n}"></div>`;

/** A form with one job block and an "Add" button that appends another, like most applicant-tracking systems. */
function jobForm(button = '<button type="button" id="add">+ Add another job</button>') {
  document.body.innerHTML = `<form><h2>Work experience</h2><div id="jobs">${JOB_BLOCK(0)}</div>${button}
    <h2>Education</h2><label for="s">School</label><input id="s"><button type="button" id="addSchool">Add</button>
    <button type="submit">Add application</button></form>`;
  let n = 1;
  document
    .querySelectorAll<HTMLButtonElement>('#add, #addJob')
    .forEach((b) =>
      b.addEventListener('click', () =>
        document.getElementById('jobs')!.insertAdjacentHTML('beforeend', JOB_BLOCK(n++)),
      ),
    );
}

const value = (id: string) => (document.getElementById(id) as HTMLInputElement).value;

describe('adding job and school blocks', () => {
  it('finds the add button by its own words or by the heading it sits under', () => {
    jobForm();
    expect(findAddButton(document, 'experience')?.id).toBe('add');
    expect(findAddButton(document, 'education')?.id).toBe('addSchool');
    jobForm('<button type="button" id="addJob">Add</button>');
    expect(findAddButton(document, 'experience')?.id).toBe('addJob');
  });

  it('never takes a submit button for an add button', () => {
    document.body.innerHTML = '<form><h2>Experience</h2><button type="submit">Add my application</button></form>';
    expect(findAddButton(document, 'experience')).toBeNull();
  });

  it('reports how many blocks the form has and whether more can be added', async () => {
    jobForm();
    const result = await fillPage(document, jobs, { location: nowhere });
    expect(result.blocks).toEqual({ experience: 1, education: 1, addExperience: true, addEducation: true });
  });

  it('adds blocks, and a fill after it gives each new block the next job, not the first again', async () => {
    jobForm();
    await fillPage(document, jobs, { location: nowhere });
    expect(value('e0')).toBe('Acme GmbH');
    expect(await addBlocks(document, 'experience', 2, 0)).toBe(2);
    await fillPage(document, jobs, { location: nowhere });
    expect([value('e0'), value('e1'), value('e2')]).toEqual(['Acme GmbH', 'Brightline', 'Copperfield']);
    expect([value('t1'), value('t2')]).toEqual(['Tester', 'Intern']);
  });
});

describe('field by field', () => {
  it('says what happened to every field and which saved answers were used', async () => {
    document.body.innerHTML = `<form>
      <label for="a">First name</label><input id="a">
      <label for="b">Nationality</label><input id="b" value="Dutch">
      <label for="c">How did you hear about us?</label><input id="c">
      <label for="d">Favourite colour</label><input id="d">
      <label for="e">Driving licence classes</label><input id="e"></form>`;
    const result = await fillPage(document, profile, { location: nowhere });
    expect(result.fields!.map((f) => [f.label, f.outcome])).toEqual([
      ['First name', 'filled'],
      ['Nationality', 'skipped'],
      ['How did you hear about us?', 'filled'],
      ['Favourite colour', 'unmatched'],
      ['Driving licence classes', 'missing'],
    ]);
    expect(result.usedAnswers).toEqual(['1']);
  });

  it('fills only inside the given root', async () => {
    document.body.innerHTML = `<label for="x">First name</label><input id="x">
      <form id="practice"><label for="y">First name</label><input id="y"></form>`;
    await fillPage(document, profile, { location: nowhere, root: document.getElementById('practice')! });
    expect([value('x'), value('y')]).toEqual(['', 'Max']);
  });
});
