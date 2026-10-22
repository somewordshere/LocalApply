type StoredData = Record<string, unknown>;

/**
 * Upgrades for stored profiles, oldest first: entry 0 turns a version 1 profile into
 * version 2, entry 1 turns version 2 into 3, and so on. Append a step whenever a release
 * renames, splits or reshapes profile data; never edit a step that has shipped.
 *
 * Example for a future version 2 that splits `phoneNumber` into two fields:
 *   (data) => ({ ...data, mobilePhone: data.phoneNumber, phoneNumber: undefined }),
 *
 * Adding a new field with a default needs no step: `migrate()` fills missing fields.
 */
const MIGRATIONS: ((data: StoredData) => StoredData)[] = [
  // 0.8.0: current job and school become the first entries of the work and education lists.
  ({ currentTitle, currentEmployer, school, degree, fieldOfStudy, ...rest }) => {
    const text = (value: unknown) => (typeof value === 'string' ? value : '');
    const job = { title: text(currentTitle), employer: text(currentEmployer) };
    const study = { school: text(school), degree: text(degree), fieldOfStudy: text(fieldOfStudy) };
    return {
      ...rest,
      experience:
        job.title || job.employer
          ? [{ id: 'w0', ...job, location: '', start: '', end: '', current: true, description: '' }]
          : [],
      education: study.school || study.degree || study.fieldOfStudy ? [{ id: 'e0', ...study, start: '', end: '' }] : [],
    };
  },
];

/** Version written into every profile saved by this build. */
export const PROFILE_VERSION = 1 + MIGRATIONS.length;

/** Brings stored data from whatever version it was saved with up to PROFILE_VERSION. */
export function upgrade(data: StoredData): StoredData {
  let version = typeof data.version === 'number' && data.version >= 1 ? Math.floor(data.version) : 1;
  let current = data;
  while (version < PROFILE_VERSION) {
    current = { ...MIGRATIONS[version - 1](current), version: version + 1 };
    version++;
  }
  return current;
}
