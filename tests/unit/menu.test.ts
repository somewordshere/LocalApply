import { describe, expect, it, vi } from 'vitest';

vi.mock('wxt/browser', () => ({ browser: {} }));

const { menuItems, menuValue } = await import('../../src/core/menu');
const { translator } = await import('../../src/ui/i18n');
import { emptyProfile } from '../../src/profile/schema';
import { profile } from './helpers';

describe('"Fill this field with" menu', () => {
  const t = translator('en');

  it('lists filled-in details with a preview, then saved answers', () => {
    const { details, answers } = menuItems(profile, t);
    expect(details.slice(0, 3)).toEqual([
      { id: 'key:fullName', title: 'Full name: Max Muster' },
      { id: 'key:firstName', title: 'First name: Max' },
      { id: 'key:lastName', title: 'Last name: Muster' },
    ]);
    expect(details.find((d) => d.id === 'key:phone')?.title).toBe('Phone: +49 151 2345678');
    expect(details.some((d) => d.id === 'key:school')).toBe(false);
    expect(answers).toEqual([{ id: 'answer:1', title: 'hear about us: LinkedIn' }]);
  });

  it('cuts long values short', () => {
    const long = { ...profile, coverLetterText: 'Dear hiring team, '.repeat(10) };
    const letter = menuItems(long, t).details.find((d) => d.id === 'key:coverLetterText')!;
    expect(letter.title.endsWith('…')).toBe(true);
    expect(letter.title.length).toBeLessThan(70);
  });

  it('offers nothing for an empty profile', () => {
    expect(menuItems(emptyProfile, t)).toEqual({ details: [], answers: [] });
  });

  it('reads the full value when an item is chosen', () => {
    expect(menuValue('key:email', profile)).toBe('max@example.com');
    expect(menuValue('answer:1', profile)).toBe('LinkedIn');
    expect(menuValue('answer:gone', profile)).toBeNull();
    expect(menuValue('edit-profile', profile)).toBeNull();
  });
});
