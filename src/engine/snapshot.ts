/** Elements a copy of the form can do without: code, styling, media, embedded pages and LocalApply's own notice. */
const DROPPED =
  'script, style, link, meta, noscript, template, iframe, frame, object, embed, img, picture, video, audio, canvas, svg, #localapply-ui';
/** Attributes that can carry tokens, addresses or tracking: dropped everywhere. */
const DROPPED_ATTRIBUTES = /^(on|style$|src$|srcset$|href$|action$|formaction$|value$|nonce$|integrity$)/i;

/**
 * A copy of the page for a bug report about a form LocalApply didn't fill well: its structure, labels,
 * names and ids, without what was typed or chosen, and without scripts, images, links or hidden values.
 * The applicant saves it themselves and can read it before sharing it.
 */
export function snapshot(doc: Document): string {
  const copy = doc.documentElement.cloneNode(true) as HTMLElement;
  for (const el of copy.querySelectorAll(DROPPED)) el.remove();
  for (const el of copy.querySelectorAll('*')) {
    for (const { name } of [...el.attributes]) if (DROPPED_ATTRIBUTES.test(name)) el.removeAttribute(name);
  }
  for (const el of copy.querySelectorAll('input')) el.removeAttribute('checked');
  for (const el of copy.querySelectorAll('option')) el.removeAttribute('selected');
  for (const el of copy.querySelectorAll('textarea, [contenteditable]')) el.textContent = '';
  return `<!doctype html>\n${copy.outerHTML}\n`;
}
