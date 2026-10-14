import { describe, expect, it } from 'vitest';
import { fillPage } from '../../src/engine';
import { formatDate } from '../../src/engine/fill';
import { scan } from '../../src/engine/scan';
import { profile, nowhere } from './helpers';

describe('framework-controlled inputs', () => {
  it('bypasses an instance-level value setter and fires input and change', async () => {
    document.body.innerHTML = '<label for="x">First name</label><input id="x" />';
    const input = document.getElementById('x') as HTMLInputElement;
    // React installs a tracking setter on the element; edits made through it are ignored.
    const native = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
    let trackedSets = 0;
    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () => native.get!.call(input),
      set: (v: string) => {
        trackedSets++;
        native.set!.call(input, v);
      },
    });
    const events: string[] = [];
    for (const type of ['input', 'change', 'blur']) input.addEventListener(type, () => events.push(type));

    await fillPage(document, profile, { location: nowhere });
    expect(native.get!.call(input)).toBe('Max');
    expect(trackedSets).toBe(0);
    expect(events).toEqual(['input', 'change', 'blur']);
  });
});

describe('dates', () => {
  it('follows the placeholder pattern', () => {
    document.body.innerHTML = '<input placeholder="DD-MM-YYYY" />';
    const [field] = scan(document);
    expect(formatDate('2027-03-09', field)).toBe('09-03-2027');
  });
});
