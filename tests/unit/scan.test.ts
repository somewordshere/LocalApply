import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { matchField } from '../../src/engine/match';
import { scan } from '../../src/engine/scan';
import { profile, nowhere } from './helpers';

describe('field discovery', () => {
  it('finds fields inside open shadow roots', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    host.attachShadow({ mode: 'open' }).innerHTML = '<label for="s">Email</label><input id="s" />';
    await fillPage(document, profile, { location: nowhere });
    expect((host.shadowRoot!.getElementById('s') as HTMLInputElement).value).toBe('max@example.com');
  });

  it('uses autocomplete tokens when there is no usable label', () => {
    document.body.innerHTML = '<input autocomplete="shipping family-name" /><input autocomplete="tel" />';
    expect(scan(document).map((f) => matchField(f))).toEqual(['lastName', 'phone']);
  });

  it('does not treat unrelated name fields as the applicant name', () => {
    document.body.innerHTML = `
      <label for="a">Company name</label><input id="a" />
      <label for="b">Emergency contact name</label><input id="b" />
      <label for="c">Username</label><input id="c" />`;
    expect(scan(document).map((f) => matchField(f))).toEqual(['currentEmployer', null, null]);
  });
});
