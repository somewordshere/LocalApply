import { describe, expect, it } from 'vitest';
import { PROFILE_VERSION, upgrade } from '../../src/profile/migrations';
import { migrate } from '../../src/profile/schema';

describe('profile migration', () => {
  it('fills in defaults and drops malformed parts', () => {
    const p = migrate({
      firstName: 'A',
      cv: { name: 1 },
      customAnswers: [{ keywords: 'k', answer: 'a' }, null],
      bogus: 1,
    });
    expect(p.firstName).toBe('A');
    expect(p.cv).toBeNull();
    expect(p.customAnswers).toEqual([{ id: 'a0', keywords: 'k', answer: 'a' }]);
    expect(p.salaryCurrency).toBe('EUR');
    expect('bogus' in p).toBe(false);
  });

  it('keeps spoken languages, dropping broken entries and unknown levels', () => {
    const p = migrate({
      languages: [
        { id: 'a', language: 'German', level: 'C1' },
        { language: 'French', level: 'fluent' },
        { level: 'B2' },
        null,
      ],
    });
    expect(p.languages).toEqual([
      { id: 'a', language: 'German', level: 'C1' },
      { id: 'l1', language: 'French', level: '' },
    ]);
  });
});

describe('profile versions', () => {
  it('stamps profiles with the current version and keeps data from older saves', () => {
    const p = migrate({ version: 1, firstName: 'A' });
    expect(p.firstName).toBe('A');
    expect(p.version).toBe(PROFILE_VERSION);
  });

  it('treats a profile without a version as version 1 and upgrades it', () => {
    expect(upgrade({ firstName: 'A' })).toEqual({ firstName: 'A', experience: [], education: [], version: 2 });
  });

  it('turns the single job and school of version 1 into the first entries of the lists', () => {
    const p = migrate({
      version: 1,
      currentTitle: 'QA Engineer',
      currentEmployer: 'Acme',
      school: 'TU Berlin',
      degree: 'M.Sc.',
      fieldOfStudy: 'Computer Science',
    });
    expect(p.experience).toEqual([
      {
        id: 'w0',
        title: 'QA Engineer',
        employer: 'Acme',
        location: '',
        start: '',
        end: '',
        current: true,
        description: '',
      },
    ]);
    expect(p.education).toEqual([
      { id: 'e0', school: 'TU Berlin', degree: 'M.Sc.', fieldOfStudy: 'Computer Science', start: '', end: '' },
    ]);
    expect('currentTitle' in p || 'school' in p).toBe(false);
    expect(migrate({ version: 1, firstName: 'A' }).experience).toEqual([]);
  });

  it('keeps work and education entries, filling in missing parts and dropping wrong types', () => {
    const p = migrate({
      version: 2,
      experience: [{ id: 'x', title: 'Dev', current: 'yes', start: '2020-01' }, null, 'junk'],
      education: [{ school: 'Uni', end: 2019 }],
    });
    expect(p.experience).toEqual([
      { id: 'x', title: 'Dev', employer: '', location: '', start: '2020-01', end: '', current: false, description: '' },
    ]);
    expect(p.education).toEqual([{ id: 'e0', school: 'Uni', degree: '', fieldOfStudy: '', start: '', end: '' }]);
  });
});
