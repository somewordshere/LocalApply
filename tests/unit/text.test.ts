import { describe, expect, it } from 'vitest';
import { norm, pickOption } from '../../src/engine/text';

describe('text helpers', () => {
  it('normalises case, separators and accents', () => {
    expect(norm('firstName')).toBe('first name');
    expect(norm('job_application[first_name]')).toBe('job application first name');
    expect(norm('Straße / Hausnr.')).toBe('strasse hausnr');
    expect(norm('Prénom *')).toBe('prenom');
  });

  it('prefers exact option matches over partial ones', () => {
    const options = ['No, I do not', 'Not sure', 'No'].map((text) => ({ text, ref: text }));
    expect(pickOption(options, ['No'])).toBe('No');
    expect(pickOption(options.slice(0, 2), ['No'])).toBe('No, I do not');
    expect(pickOption(options, ['Maybe'])).toBeUndefined();
  });
});
