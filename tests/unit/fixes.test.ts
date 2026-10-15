import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { fillPage } from '../../src/engine';
import { matchField } from '../../src/engine/match';
import { scan } from '../../src/engine/scan';
import { emptyProfile, questionKeywords } from '../../src/profile/schema';
import { saveProfile, watchProfile } from '../../src/profile/store';
import { profile, nowhere, value } from './helpers';

vi.mock('wxt/browser', () => ({ browser: fakeBrowser }));

const NAME_FIELDS = `
  <label for="f">First name</label><input id="f">
  <label for="l">Last name</label><input id="l">`;

// Bugs found in a code review, each reproduced before it was fixed.
describe('review fixes', () => {
  it('does not answer "do you hold a visa" with the sponsorship answer', () => {
    document.body.innerHTML = `
      <label for="h">Do you hold a valid visa for Germany?</label><select id="h"><option>Yes</option><option>No</option></select>
      <label for="n">Will you need a work visa to take this job?</label><select id="n"><option>Yes</option><option>No</option></select>
      <label for="d">Benötigen Sie ein Visum?</label><select id="d"><option>Ja</option><option>Nein</option></select>`;
    expect(scan(document).map((f) => matchField(f))).toEqual([null, 'needsSponsorship', 'needsSponsorship']);
  });

  it('leaves address line 2 empty', async () => {
    document.body.innerHTML = `<form>
      <label for="a1">Address line 1</label><input id="a1">
      <label for="a2">Address line 2</label><input id="a2">
      <label for="a3">Street</label><input id="a3" name="addressLine2">
      <label for="c">City</label><input id="c"></form>`;
    await fillPage(document, profile, { location: nowhere });
    expect(value('a1')).toBe('Hauptstr. 5');
    expect(value('a2')).toBe('');
    expect(value('a3')).toBe('');
  });

  it('does not put the current employer into questions about the company', async () => {
    document.body.innerHTML = `<form>
      <label for="q">What excites you about our company?</label><input id="q">
      <label for="t">Company</label><textarea id="t"></textarea>
      <label for="c">Current company</label><input id="c">${NAME_FIELDS}</form>`;
    await fillPage(document, profile, { location: nowhere });
    expect(value('q')).toBe('');
    expect(value('t')).toBe('');
    expect(value('c')).toBe('Acme GmbH');
  });

  it('keeps a CV upload that sits in a form of its own', async () => {
    document.body.innerHTML = `
      <form>${NAME_FIELDS}<label for="e">Email</label><input id="e"></form>
      <form><label for="cv">Resume/CV</label><input type="file" id="cv"></form>
      <form><label for="nl">Newsletter email</label><input id="nl"></form>`;
    const result = await fillPage(document, profile, { location: nowhere });
    // jsdom cannot attach files, so check the upload was handled (here: reported as missing) rather than dropped.
    expect(result.total).toBe(4);
    expect(result.missing).toEqual([{ label: 'Resume/CV', key: 'cv' }]);
    expect(value('nl')).toBe('');
  });

  it('keeps a choice already shown on a dropdown button, but fills one showing a prompt', async () => {
    document.body.innerHTML = `<form>
      <label id="gl">Gender</label>
      <button type="button" aria-haspopup="listbox" aria-labelledby="gl" aria-controls="g">Prefer not to say</button>
      <ul id="g" role="listbox"><li role="option">Male</li><li role="option">Prefer not to say</li></ul>
      <label id="rl">Willing to relocate?</label>
      <button type="button" aria-haspopup="listbox" aria-labelledby="rl" aria-controls="r">Select One</button>
      <ul id="r" role="listbox"><li role="option">Yes</li><li role="option">No</li></ul>${NAME_FIELDS}</form>`;
    const clicked: string[] = [];
    for (const o of document.querySelectorAll('[role=option]'))
      o.addEventListener('click', () => clicked.push(o.textContent!));
    const result = await fillPage(
      document,
      { ...profile, gender: 'Male', willingToRelocate: 'yes' },
      { location: nowhere },
    );
    expect(clicked).toEqual(['Yes']);
    expect(result.skipped).toBe(1);
  });

  it('keeps an answer saved from the popup tied to its own question', async () => {
    document.body.innerHTML = `<form><label for="o">When did you graduate?</label><input id="o">${NAME_FIELDS}</form>`;
    const keywords = questionKeywords('Have you applied before? If yes, when?');
    await fillPage(
      document,
      { ...profile, customAnswers: [{ id: 'x', keywords, answer: 'March 2025' }] },
      { location: nowhere },
    );
    expect(value('o')).toBe('');
  });

  it('matches saved-answer keywords as whole words only', async () => {
    document.body.innerHTML = `<form>
      <label for="lang">Which languages do you speak?</label><input id="lang">
      <label for="age">Age</label><input id="age">${NAME_FIELDS}</form>`;
    await fillPage(
      document,
      { ...profile, customAnswers: [{ id: 'x', keywords: 'age', answer: '35' }] },
      { location: nowhere },
    );
    expect(value('lang')).toBe('');
    expect(value('age')).toBe('35');
  });

  it('never clicks a hidden option of another dropdown', async () => {
    document.body.innerHTML = `<form>
      <label id="rl">Willing to relocate?</label>
      <button type="button" aria-haspopup="listbox" aria-labelledby="rl">Select</button>
      <div hidden><ul role="listbox"><li role="option" id="other">Yes</li><li role="option">No</li></ul></div>${NAME_FIELDS}</form>`;
    let clicked = false;
    document.getElementById('other')!.addEventListener('click', () => (clicked = true));
    await fillPage(document, { ...profile, willingToRelocate: 'yes' }, { location: nowhere });
    expect(clicked).toBe(false);
  });

  it('types each alternative into a searchable dropdown until one matches', async () => {
    document.body.innerHTML = `<form>
      <label for="c">Country</label><input id="c" role="combobox" aria-controls="list">
      <ul id="list" role="listbox"></ul>${NAME_FIELDS}</form>`;
    const input = document.getElementById('c') as HTMLInputElement;
    const list = document.getElementById('list')!;
    let picked = '';
    // Lists only the countries whose English name starts with the typed text.
    input.addEventListener('input', () => {
      const typed = input.value.toLowerCase();
      list.innerHTML = ['Germany', 'Greece']
        .filter((c) => typed && c.toLowerCase().startsWith(typed))
        .map((c) => `<li role="option">${c}</li>`)
        .join('');
      for (const o of list.children) o.addEventListener('click', () => (picked = o.textContent!));
    });
    await fillPage(document, { ...profile, country: 'Deutschland' }, { location: nowhere });
    expect(picked).toBe('Germany');
  });

  it('clears the search text when no alternative matches', async () => {
    document.body.innerHTML = `<form>
      <label for="c">Country</label><input id="c" role="combobox" aria-controls="list">
      <ul id="list" role="listbox"><li role="option">France</li></ul>${NAME_FIELDS}</form>`;
    await fillPage(document, { ...profile, country: 'Portugal' }, { location: nowhere });
    expect(value('c')).toBe('');
  });

  it('writes into a rich text editor through an edit the editor sees', async () => {
    document.body.innerHTML = `<form>
      <label id="cl">Cover letter</label><div id="ed" contenteditable="true" aria-labelledby="cl"></div>${NAME_FIELDS}</form>`;
    const editor = document.getElementById('ed')!;
    const inserted: string[] = [];
    // Stands in for an editor that applies insertText edits to its own model.
    document.execCommand = ((command: string, _ui?: boolean, text?: string) => {
      if (command !== 'insertText') return false;
      inserted.push(text!);
      editor.innerHTML = `<p>${text}</p>`;
      return true;
    }) as typeof document.execCommand;
    try {
      await fillPage(document, profile, { location: nowhere });
    } finally {
      delete (document as { execCommand?: unknown }).execCommand;
    }
    expect(inserted).toEqual(['Dear hiring team']);
    expect(editor.innerHTML).toBe('<p>Dear hiring team</p>');
  });

  it('tells the profile page about saves from elsewhere but not about its own', async () => {
    const seen: string[] = [];
    const stop = watchProfile((p) => seen.push(p.firstName));
    await saveProfile({ ...emptyProfile, firstName: 'Own' });
    await fakeBrowser.storage.local.set({ profile: { ...emptyProfile, firstName: 'Popup' }, profileRevision: 'other' });
    stop();
    expect(seen).toEqual(['Popup']);
  });
});
