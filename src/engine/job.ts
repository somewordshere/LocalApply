/** The posting an application belongs to, as far as the page tells. */
export interface Job {
  company?: string;
  position?: string;
  /** The posting page, as kept in the application log (see logUrl). Set by the top frame. */
  url?: string;
  /** The job description as plain text, from the posting's schema.org data; kept with the application. */
  description?: string;
}

/** Longest job description kept with an application. */
const MAX_DESCRIPTION = 20000;

/** Text of a description that job boards write as HTML, with paragraph and list breaks kept as line breaks. */
function plainText(html: string): string {
  const breaks = html.replace(/<(br|\/p|\/li|\/h\d|\/div)\b[^>]*>/gi, (tag) => `${tag}\n`);
  const doc = new DOMParser().parseFromString(breaks, 'text/html');
  return (doc.body.textContent ?? '')
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_DESCRIPTION);
}

/** Hosts and site names that sit in titles and og:site_name but are not the employer. */
const NOT_THE_EMPLOYER =
  /^(?:greenhouse|lever|workday|ashby|personio|smartrecruiters|successfactors|sap successfactors|linkedin|indeed|teamtailor|recruitee|join|stepstone|xing|glassdoor|careers?|jobs?|karriere|stellenangebote?|emplois?|empleos?|lavora con noi|vacatures?|vagas?|praca|apply|application|job application|bewerbung)$/i;

const clean = (s: unknown) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');
const isEmployer = (s: string) => s.length > 1 && !NOT_THE_EMPLOYER.test(s);

/** schema.org JobPosting, which most job boards embed for search engines. */
function fromStructuredData(doc: Document): Job {
  const found: Job = {};
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object' || (found.position && found.company)) return;
    if (Array.isArray(node)) return node.forEach(visit);
    const item = node as Record<string, unknown>;
    const type = item['@type'];
    if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
      const org = item.hiringOrganization;
      found.position ||= clean(item.title);
      found.company ||= clean(typeof org === 'string' ? org : (org as Record<string, unknown> | undefined)?.name);
      if (typeof item.description === 'string') found.description ||= plainText(item.description);
    }
    visit(item['@graph']);
  };
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      visit(JSON.parse(script.textContent ?? ''));
    } catch {
      // Malformed JSON-LD is common; skip it.
    }
  }
  return found;
}

/**
 * "Job Application for QA Engineer at Acme", "QA Engineer · Acme", "Acme - QA Engineer | Lever". Only the
 * English, German, French, Italian and Dutch words for "at": the others also occur inside job titles.
 */
function fromTitle(doc: Document, heading: string): Job {
  const title = clean(doc.title);
  const at =
    /^(?:job application for |application for |apply for )?(.+?) (?:at|bei|chez|presso|bij) (.+?)(?: [|·–—-] .*)?$/i.exec(
      title,
    );
  if (at && isEmployer(clean(at[2]))) return { position: clean(at[1]), company: clean(at[2]) };

  const parts = title
    .split(/ [|·–—-] /)
    .map(clean)
    .filter(isEmployer);
  if (parts.length < 2) return {};
  // The part that repeats the page heading is the job; the first other part is the employer.
  const job = parts.find((p) => p.toLowerCase() === heading.toLowerCase()) ?? parts[0];
  return { position: job, company: parts.find((p) => p !== job) };
}

/** Reads the employer and job title from the page, best source first. Either may be missing. */
export function readJob(doc: Document): Job {
  const heading = clean(doc.querySelector('h1')?.textContent);
  const structured = fromStructuredData(doc);
  const titled = fromTitle(doc, heading);
  const site = clean(doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content'));
  return {
    position: structured.position || titled.position || heading || undefined,
    company: structured.company || titled.company || (isEmployer(site) ? site : undefined),
    ...(structured.description ? { description: structured.description } : {}),
  };
}

/** "GmbH", "Inc.", "Sp. z o.o." and the like at the end of a company name. */
const LEGAL_FORM =
  /[\s,]+(?:gmbh(?:\s*&\s*co\.?\s*kg)?|ag|se|kg|ohg|ug(?:\s*\(haftungsbeschränkt\))?|e\.\s?v\.|inc\.?|llc|ltd\.?|limited|plc|corp\.?|corporation|s\.\s?a\.|sas|s\.?r\.?l\.?|s\.?p\.?a\.?|b\.\s?v\.|bv|n\.\s?v\.|nv|sp\.\s?z\s?o\.\s?o\.|s\.\s?l\.|lda\.?)$/i;

/** The company name without its legal form: "Acme GmbH" is "Acme". */
export function shortCompany(name: string): string {
  return clean(name).replace(LEGAL_FORM, '').trim();
}

/** A company name reduced for comparing: "ACME GmbH", "Acme" and "acme." are the same employer. */
export function companyKey(name: string): string {
  return shortCompany(name)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

const asWord = (s: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu');

/**
 * The reverse of fillPlaceholders: the posting's job title and employer in a text become {position} and
 * {company}, so an answer written for one application fits the next.
 */
export function withPlaceholders(text: string, job: Job | undefined): string {
  let out = text;
  const position = clean(job?.position);
  if (position.length > 1) out = out.replace(asWord(position), '{position}');
  const company = clean(job?.company);
  for (const name of new Set([company, shortCompany(company)])) {
    if (name.length > 1) out = out.replace(asWord(name), '{company}');
  }
  return out;
}

const PLACEHOLDER = /\{\s*(company|employer|position|role|job|title)\s*\}/gi;

/**
 * Replaces {company} and {position} (also {employer}, {role}, {job}, {title}) with the posting's values.
 * Returns null when the text needs a value the page didn't give, so nothing half-finished is typed.
 */
export function fillPlaceholders(text: string, job: Job | undefined): string | null {
  let missing = false;
  const result = text.replace(PLACEHOLDER, (_, name: string) => {
    const value = /^(company|employer)$/i.test(name) ? job?.company : job?.position;
    if (!value) missing = true;
    return value ?? '';
  });
  return missing ? null : result;
}
