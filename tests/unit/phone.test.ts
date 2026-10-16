import { describe, expect, it } from 'vitest';
import { migrate } from '../../src/profile/schema';
import { joinPhone, splitPhone } from '../../src/profile/phone';

const split = (full: string) => {
  const parts = splitPhone(full);
  return [parts.phoneCountryCode, parts.phoneNumber];
};

describe('full phone numbers', () => {
  it('splits off two-digit country codes', () => {
    expect(split('+48791532218')).toEqual(['+48', '791532218']);
    expect(split('+49 151 2345678')).toEqual(['+49', '151 2345678']);
    expect(split('0048 791 532 218')).toEqual(['+48', '791 532 218']);
  });

  it('splits off one- and three-digit country codes', () => {
    expect(split('+1 (555) 123-4567')).toEqual(['+1', '(555) 123-4567']);
    expect(split('+79161234567')).toEqual(['+7', '9161234567']);
    expect(split('+351912345678')).toEqual(['+351', '912345678']);
    expect(split('+420 601 123 456')).toEqual(['+420', '601 123 456']);
    expect(split('+971501234567')).toEqual(['+971', '501234567']);
  });

  it('drops the domestic "(0)" written after the code', () => {
    expect(split('+49 (0)151 2345678')).toEqual(['+49', '151 2345678']);
  });

  it('leaves a number without + or 00 as it is', () => {
    expect(split('0151 2345678')).toEqual(['', '0151 2345678']);
    expect(split('  ')).toEqual(['', '']);
    expect(split('+4')).toEqual(['', '+4']);
  });

  it('joins the parts back into one number', () => {
    expect(joinPhone({ phoneCountryCode: '+48', phoneNumber: '791532218' })).toBe('+48 791532218');
    expect(joinPhone({ phoneCountryCode: '', phoneNumber: '0151 2345678' })).toBe('0151 2345678');
  });

  it('remembers which way the profile page asks for it', () => {
    expect(migrate({}).phoneEntry).toBe('split');
    expect(migrate({ phoneEntry: 'full' }).phoneEntry).toBe('full');
    expect(migrate({ phoneEntry: 'nonsense' }).phoneEntry).toBe('split');
  });
});
