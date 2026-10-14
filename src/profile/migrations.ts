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
const MIGRATIONS: ((data: StoredData) => StoredData)[] = [];

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
