/**
 * Lowercases, splits camelCase, strips accents and punctuation so that
 * "firstName", "first_name", "Prénom *" and "Straße" compare as plain words.
 */
export function norm(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ł/g, 'l')
    .replace(/ø/g, 'o')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[_\-[\](){}/\\.:*?!¿¡,;|'’"“”<>=]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Regex matching any of the phrases as whole words in normalised text. */
export function phrases(list: string[]): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${list.join('|')})(?![\\p{L}\\p{N}])`, 'u');
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface Option<T> {
  text: string;
  value?: string;
  ref: T;
}

/** Picks the option that best matches one of the candidates, earlier candidates first. */
export function pickOption<T>(options: Option<T>[], candidates: string[]): T | undefined {
  const opts = options.map((o) => ({ t: norm(o.text), v: norm(o.value ?? ''), ref: o.ref })).filter((o) => o.t || o.v);
  const cands = candidates.map(norm).filter(Boolean);
  for (const c of cands) {
    const exact = opts.find((o) => o.t === c || o.v === c);
    if (exact) return exact.ref;
  }
  for (const c of cands) {
    const starts = opts.find((o) => o.t.startsWith(c + ' '));
    if (starts) return starts.ref;
    if (c.length < 3) continue;
    const re = phrases([escapeRegex(c)]);
    const contains = opts.find((o) => re.test(o.t));
    if (contains) return contains.ref;
  }
  return undefined;
}
