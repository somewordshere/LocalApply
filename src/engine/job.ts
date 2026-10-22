/** The posting an application belongs to, as far as the page tells. */
export interface Job {
  company?: string;
  position?: string;
  /** The posting page, as kept in the application log (see logUrl). Set by the top frame. */
  url?: string;
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
  };
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
