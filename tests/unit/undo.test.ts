import { describe, expect, it } from 'vitest';
import { fillPage, undoLastFill } from '../../src/engine';
import { profile, nowhere, value } from './helpers';

const FORM = `<form>
  <label for="f">First name</label><input id="f">
  <label for="l">Last name</label><input id="l" value="Typed by me">
  <label for="c">Country</label><select id="c"><option value="">Choose</option><option>Germany</option><option>France</option></select>
  <fieldset><legend>Are you authorised to work in Germany?</legend>
    <label><input type="radio" name="w" value="y" /> Yes</label><label><input type="radio" name="w" value="n" /> No</label></fieldset>
  <fieldset><legend>Willing to relocate?</legend>
    <label><input type="radio" name="r" value="y" /> Yes</label><label><input type="radio" name="r" value="n" checked /> No</label></fieldset>
  <label id="cl">Cover letter</label><div id="cover" contenteditable="true" aria-labelledby="cl"></div>
  <label for="q">How did you hear about us? *</label><input id="q" required>
</form>`;

const checked = (name: string) =>
  (document.querySelector(`[name="${name}"]:checked`) as HTMLInputElement | null)?.value;

describe('undo', () => {
  it('puts every filled field back the way it was', async () => {
    document.body.innerHTML = FORM;
    const filled = await fillPage(
      document,
      { ...profile, willingToRelocate: 'yes', customAnswers: [] },
      { location: nowhere, overwrite: true },
    );
    expect(value('f')).toBe('Max');
    expect(value('l')).toBe('Muster');
    expect(value('c')).toBe('Germany');
    expect(checked('w')).toBe('y');
    expect(checked('r')).toBe('y');
    expect(document.getElementById('cover')!.textContent).toBe('Dear hiring team');

    const result = undoLastFill(document);
    expect(result).toEqual({ restored: filled.filled.length, manual: [] });
    expect(value('f')).toBe('');
    expect(value('l')).toBe('Typed by me');
    expect(value('c')).toBe('');
    expect(checked('w')).toBeUndefined();
    expect(checked('r')).toBe('n');
    expect(document.getElementById('cover')!.textContent).toBe('');
    expect(document.querySelectorAll('[data-jaf-mark]').length).toBe(0);
  });

  it('undoes only once, and a fill that changes nothing keeps the earlier one undoable', async () => {
    document.body.innerHTML = FORM;
    await fillPage(document, profile, { location: nowhere });
    await fillPage(document, profile, { location: nowhere });
    expect(undoLastFill(document).restored).toBeGreaterThan(0);
    expect(value('f')).toBe('');
    expect(undoLastFill(document)).toEqual({ restored: 0, manual: [] });
  });

  it('lists a custom dropdown it cannot put back and outlines it', async () => {
    document.body.innerHTML = `<form>
      <label id="gl">Gender</label>
      <button type="button" id="g" aria-haspopup="listbox" aria-labelledby="gl" aria-controls="lb">Select</button>
      <ul id="lb" role="listbox"><li role="option">Male</li><li role="option">Female</li></ul>
      <label for="f">First name</label><input id="f">
      <label for="l">Last name</label><input id="l"></form>`;
    const button = document.getElementById('g')!;
    // The widget shows the picked option on its button.
    for (const o of document.querySelectorAll('[role=option]')) {
      o.addEventListener('click', () => (button.textContent = o.textContent));
    }
    await fillPage(document, { ...profile, gender: 'Male' }, { location: nowhere });
    expect(button.textContent).toBe('Male');

    const result = undoLastFill(document);
    expect(result).toEqual({ restored: 2, manual: [{ label: 'Gender' }] });
    expect(button.getAttribute('data-jaf-mark')).toBe('attention');
  });
});

describe('outlines', () => {
  it('differ in line style as well as colour', async () => {
    document.body.innerHTML = FORM;
    await fillPage(document, { ...profile, customAnswers: [] }, { location: nowhere });
    expect(document.getElementById('f')!.style.outline).toBe('2px solid #16a34a');
    expect(document.getElementById('q')!.style.outline).toBe('2px dashed #d97706');
  });
});
