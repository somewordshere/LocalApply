import type { Field, FieldKind, FieldOption } from './types';

const FIELD_SELECTOR =
  'input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"], button[aria-haspopup="listbox"]';

const JUNK = `${FIELD_SELECTOR}, option, script, style, noscript, template, button, svg, [role="listbox"]`;

const SKIPPED_INPUT_TYPES = new Set([
  'hidden',
  'submit',
  'button',
  'reset',
  'image',
  'password',
  'search',
  'range',
  'color',
]);

/** Site navigation, search and cookie dialogs are never part of an application. */
const PAGE_CHROME =
  'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], [role="search"], [id*="ookie"], [class*="ookie"]';

const REQUIRED_MARK =
  /\*|\b(required|erforderlich|pflichtfeld|obligatoire|obligatorio|obbligatorio|verplicht|wymagane)\b/i;
const LANGUAGE_SWITCH = /^((select|choose|change) language|sprache (aus)?w[aä]hlen)\b|^(language|sprache)$/i;

const MAX_LABEL = 200;

function collect(root: ParentNode, out: HTMLElement[]): void {
  for (const el of root.querySelectorAll<HTMLElement>(FIELD_SELECTOR)) out.push(el);
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    if (el.shadowRoot) collect(el.shadowRoot, out);
  }
}

export function isVisible(el: Element): boolean {
  const check = (el as Element & { checkVisibility?: (o?: object) => boolean }).checkVisibility;
  if (typeof check === 'function') return check.call(el, { visibilityProperty: true });
  for (let node: Element | null = el; node; node = node.parentElement) {
    const html = node as HTMLElement;
    if (html.hidden || html.style?.display === 'none' || html.style?.visibility === 'hidden') return false;
  }
  return true;
}

function clean(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL);
}

function byId(el: Element, id: string): Element | null {
  const root = el.getRootNode() as Document | ShadowRoot;
  return root.getElementById?.(id) ?? el.ownerDocument.getElementById(id);
}

/** Visible text of a container, leaving out form controls and anything `skip` rejects. */
function textOf(node: Element, skip: (el: Element) => boolean = () => false): string {
  let out = '';
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      out += n.textContent;
      return;
    }
    if (n.nodeType !== 1) return;
    const el = n as Element;
    if (el.matches(JUNK) || skip(el)) return;
    for (const child of el.childNodes) walk(child);
    out += ' ';
  };
  walk(node);
  return clean(out);
}

/**
 * Walks up from the control looking for nearby text, stopping once a container
 * holds other fields as well (its text would no longer describe just this one).
 */
function nearbyText(start: Element, own: Set<Element>, skip?: (el: Element) => boolean): string {
  let child: Element = start;
  for (let depth = 0; depth < 5 && child.parentElement; depth++) {
    const parent = child.parentElement;
    const foreign = [...parent.querySelectorAll(FIELD_SELECTOR)].some(
      (f) => !own.has(f) && (f as HTMLInputElement).type !== 'hidden',
    );
    if (foreign) {
      const prev = child.previousElementSibling;
      if (prev && !prev.querySelector(FIELD_SELECTOR) && !prev.matches(FIELD_SELECTOR)) return textOf(prev, skip);
      return '';
    }
    const text = textOf(parent, skip);
    if (text) return text;
    child = parent;
  }
  return '';
}

function referencedText(el: Element): string {
  const ids = el.getAttribute('aria-labelledby');
  if (!ids) return '';
  return clean(
    ids
      .split(/\s+/)
      .map((id) => byId(el, id)?.textContent ?? '')
      .join(' '),
  );
}

function labelOf(el: HTMLElement): string {
  const referenced = referencedText(el);
  if (referenced) return referenced;
  const labels = (el as HTMLInputElement).labels;
  if (labels?.length) {
    const text = textOf(labels[0]);
    if (text) return text;
  }
  const aria = clean(el.getAttribute('aria-label'));
  if (aria) return aria;
  const near = nearbyText(el, new Set([el]));
  if (near) return near;
  return clean(el.getAttribute('placeholder') || el.getAttribute('title'));
}

/** Question text of a radio or checkbox group: what surrounds the options, minus their own labels. */
function groupLabel(inputs: HTMLInputElement[]): string {
  const optionLabels = new Set<Element>();
  for (const input of inputs) for (const label of input.labels ?? []) optionLabels.add(label);
  const skip = (el: Element) => optionLabels.has(el);

  const first = inputs[0];
  const group = first.closest('[role="radiogroup"], [role="group"], fieldset');
  if (group && inputs.every((i) => group.contains(i))) {
    const legend = group.querySelector('legend');
    if (legend) return clean(legend.textContent);
    const referenced = referencedText(group);
    if (referenced) return referenced;
    const aria = clean(group.getAttribute('aria-label'));
    if (aria) return aria;
  }
  let common: Element | null = first.parentElement;
  while (common && !inputs.every((i) => common!.contains(i))) common = common.parentElement;
  if (!common) return '';
  return textOf(common, skip) || nearbyText(common, new Set<Element>(inputs), skip);
}

function optionLabel(el: HTMLInputElement): string {
  const label = el.labels?.[0];
  return (
    clean(label?.textContent) || clean(el.getAttribute('aria-label')) || clean(el.nextSibling?.textContent) || el.value
  );
}

function kindOf(el: HTMLElement): FieldKind | null {
  if (el instanceof HTMLSelectElement) return 'select';
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();
    if (SKIPPED_INPUT_TYPES.has(type)) return null;
    if (type === 'radio') return 'radio';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'file') return 'file';
    if (type === 'date' || type === 'month') return 'date';
    if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-autocomplete') === 'list') return 'combobox';
    return 'text';
  }
  if (el.getAttribute('role') === 'combobox' || el.getAttribute('aria-haspopup') === 'listbox') return 'combobox';
  if (el.hasAttribute('contenteditable')) return 'textarea';
  return null;
}

function usable(el: HTMLElement, kind: FieldKind): boolean {
  const control = el as HTMLInputElement;
  if (el.closest(PAGE_CHROME)) return false;
  if (control.disabled || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (control.readOnly && kind !== 'combobox') return false;
  // File inputs, radios and checkboxes are routinely hidden behind styled replacements.
  if (kind === 'file') return true;
  if (kind === 'radio' || kind === 'checkbox')
    return isVisible(el) || (el.parentElement ? isVisible(el.parentElement) : false);
  return isVisible(el);
}

function describe(el: HTMLElement, kind: FieldKind, label: string, options: FieldOption[]): Field {
  const control = el as HTMLInputElement;
  return {
    el,
    kind,
    type: el instanceof HTMLInputElement ? el.type.toLowerCase() : '',
    label,
    attrs: [
      el.getAttribute('name'),
      el.id,
      el.getAttribute('data-automation-id'),
      el.getAttribute('data-testid'),
      el.getAttribute('data-qa'),
    ].filter((a): a is string => Boolean(a)),
    autocomplete: (el.getAttribute('autocomplete') ?? '').toLowerCase().split(/\s+/).filter(Boolean),
    placeholder: el.getAttribute('placeholder') ?? '',
    required: Boolean(control.required) || el.getAttribute('aria-required') === 'true' || REQUIRED_MARK.test(label),
    options,
  };
}

function addTo(groups: Map<string, HTMLInputElement[]>, key: string, input: HTMLInputElement): void {
  const group = groups.get(key);
  if (group) group.push(input);
  else groups.set(key, [input]);
}

/** Finds every fillable control under root, including inside open shadow roots. */
export function scan(root: ParentNode): Field[] {
  const found: HTMLElement[] = [];
  collect(root, found);
  const elements = [...new Set(found)];
  const all = new Set<Element>(elements);

  const fields: Field[] = [];
  const radioGroups = new Map<string, HTMLInputElement[]>();
  const checkGroups = new Map<string, HTMLInputElement[]>();

  for (const el of elements) {
    const kind = kindOf(el);
    if (!kind || !usable(el, kind)) continue;

    if (kind === 'radio') {
      const radio = el as HTMLInputElement;
      addTo(radioGroups, radio.name || `#${radio.id || radioGroups.size}`, radio);
      continue;
    }
    if (kind === 'checkbox') {
      const box = el as HTMLInputElement;
      addTo(checkGroups, box.name || `#${checkGroups.size}`, box);
      continue;
    }

    // A wrapper marked as combobox around a real input: keep only the input.
    if (kind === 'combobox' && !(el instanceof HTMLInputElement)) {
      if (
        [...el.querySelectorAll('input, select, textarea')].some(
          (inner) => all.has(inner) && kindOf(inner as HTMLElement),
        )
      )
        continue;
    }

    const options: FieldOption[] =
      el instanceof HTMLSelectElement ? [...el.options].map((o) => ({ text: o.text, value: o.value, el: o })) : [];
    const label = labelOf(el);
    if (LANGUAGE_SWITCH.test(label)) continue;
    fields.push(describe(el, kind, label, options));
  }

  for (const radios of radioGroups.values()) {
    const options = radios.map((r) => ({ text: optionLabel(r), value: r.value, el: r }));
    const field = describe(radios[0], 'radio', groupLabel(radios), options);
    field.required = field.required || radios.some((r) => r.required);
    fields.push(field);
  }

  // Several checkboxes sharing a name are one multiple-choice question; a lone one stands by itself.
  for (const boxes of checkGroups.values()) {
    if (boxes.length === 1) {
      fields.push(describe(boxes[0], 'checkbox', labelOf(boxes[0]), []));
      continue;
    }
    const options = boxes.map((b) => ({ text: optionLabel(b), value: b.value, el: b }));
    const field = describe(boxes[0], 'checkgroup', groupLabel(boxes), options);
    field.required = field.required || boxes.some((b) => b.required);
    fields.push(field);
  }

  return fields;
}
