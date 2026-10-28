import { isVisible } from './scan';
import type { Blocks, FieldKey } from './types';

export type BlockKind = 'experience' | 'education';

/** The keys that make up one job or one school block; a form has as many blocks as its most repeated key. */
const BLOCK_KEYS: Record<BlockKind, FieldKey[]> = {
  experience: ['currentEmployer', 'currentTitle'],
  education: ['school', 'degree', 'fieldOfStudy'],
};

/** "Add", "+ Add another" and the like, in the eight languages. */
const ADD = /^\s*\+|\b(add|hinzuf[uü]gen|ajouter|a[ñn]adir|agregar|aggiungi|toevoegen|adicionar|dodaj)\b/i;
const KIND: Record<BlockKind, RegExp> = {
  experience:
    /experience|employment|work history|\bjob|position|erfahrung|besch[aä]ftigung|t[aä]tigkeit|exp[ée]rience|emploi|\bposte|experiencia|empleo|esperienz|lavor|ervaring|werkgever|\bbaan|experi[êe]ncia|emprego|do[sś]wiadczeni|zatrudnieni/i,
  education:
    /education|school|degree|\bstud|ausbildung|bildung|schule|abschluss|formation|dipl[ôo]me|[ée]tudes|educaci[oó]n|formaci[oó]n|istruzione|formazione|opleiding|educa[çc][aã]o|forma[çc][aã]o|wykszta[łl]ceni|edukacj/i,
};

const BUTTONS = 'button, [role="button"], a, input[type="button"]';
const HEADINGS = 'h1, h2, h3, h4, h5, legend, [role="heading"]';
const TEXT_LIMIT = 80;

/** What a button says: its text, an input button's value, its aria-label, and Workday's automation id ("Add"). */
const textOf = (el: Element) =>
  [
    el instanceof HTMLInputElement ? el.value : '',
    el.textContent,
    el.getAttribute('aria-label'),
    el.getAttribute('data-automation-id'),
  ].join(' ');

/** The heading of the section a control sits in: the nearest heading before it, a few containers up. */
function sectionHeading(el: Element): string {
  let node: Element | null = el;
  for (let depth = 0; node && depth < 6; depth++, node = node.parentElement) {
    const headings = [...node.querySelectorAll(HEADINGS)].filter(
      (h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    const nearest = headings.at(-1);
    if (nearest?.textContent?.trim()) return nearest.textContent.trim();
  }
  return '';
}

/**
 * The button that adds another job or school block: one that says "add" and names the kind ("Add another
 * job", "Weitere Ausbildung hinzufügen"), or a bare "Add" under a heading that does ("Work Experience").
 */
export function findAddButton(root: ParentNode, kind: BlockKind): HTMLElement | null {
  const other: BlockKind = kind === 'experience' ? 'education' : 'experience';
  for (const el of root.querySelectorAll<HTMLElement>(BUTTONS)) {
    const text = textOf(el).replace(/\s+/g, ' ').trim();
    if (!text || text.length > TEXT_LIMIT || !ADD.test(text) || !isVisible(el)) continue;
    if ((el as HTMLButtonElement).type === 'submit' || el.closest('nav, header, footer')) continue;
    if (KIND[kind].test(text) && !KIND[other].test(text)) return el;
    if (KIND[other].test(text)) continue;
    const heading = sectionHeading(el);
    if (KIND[kind].test(heading) && !KIND[other].test(heading)) return el;
  }
  return null;
}

/** How many job and school blocks a fill met, from how often each block key came up, and whether more can be added. */
export function countBlocks(seen: Map<FieldKey, number>, root: ParentNode): Blocks {
  const count = (kind: BlockKind) => Math.max(0, ...BLOCK_KEYS[kind].map((key) => seen.get(key) ?? 0));
  return {
    experience: count('experience'),
    education: count('education'),
    addExperience: Boolean(findAddButton(root, 'experience')),
    addEducation: Boolean(findAddButton(root, 'education')),
  };
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Presses the form's add button for the kind `times` times, waiting for each new block to appear. Asked for by
 * the applicant in the popup; it adds empty blocks and never submits. Returns how many it added.
 */
export async function addBlocks(root: ParentNode, kind: BlockKind, times: number, wait = 500): Promise<number> {
  let added = 0;
  for (; added < times; added++) {
    const button = findAddButton(root, kind);
    if (!button) break;
    button.click();
    await pause(wait);
  }
  return added;
}
