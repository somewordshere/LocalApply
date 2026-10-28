import type { Learned } from '../engine/learn';
import type { Translate } from './i18n';

export interface LearnCardActions {
  /** The answers the applicant kept ticked, as edited. */
  save: (picked: Learned[]) => void;
  /** "Not now": hide the card until another answer comes in. */
  dismiss: () => void;
}

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function button(label: string, run: () => void, className = ''): HTMLButtonElement {
  const b = make('button', className, label);
  b.type = 'button';
  b.addEventListener('click', run);
  return b;
}

/**
 * The on-page card offering to save answers the applicant typed into the form. Folded, it says how many
 * there are; Review lists each one with a box to untick and its text to edit before saving.
 * Built from DOM nodes only, like the notice: page text never goes in as HTML.
 */
export function learnCard(items: Learned[], t: Translate, actions: LearnCardActions): HTMLElement {
  const card = make('div', 'learn');
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', t('learn.title'));

  const fold = () => {
    card.classList.remove('open');
    const buttons = make('div', 'actions');
    buttons.append(button(t('learn.review'), unfold), button(t('learn.notNow'), actions.dismiss, 'quiet'));
    card.replaceChildren(make('p', '', t('learn.summary', { n: items.length })), buttons);
  };

  const unfold = () => {
    card.classList.add('open');
    const list = make('ul');
    const rows = items.map((item) => {
      const li = make('li');
      const label = make('label', 'question');
      const tick = make('input');
      tick.type = 'checkbox';
      tick.checked = true;
      label.append(tick, make('span', '', item.label));
      const text = make('textarea');
      text.value = item.answer;
      text.rows = Math.min(4, Math.max(1, Math.ceil(item.answer.length / 40)));
      text.setAttribute('aria-label', t('popup.answerFor', { label: item.label }));
      li.append(label, text);
      if (item.replaces) li.append(make('p', 'note', t('learn.replaces')));
      list.append(li);
      return { item, tick, text };
    });
    const save = () => {
      const picked = rows
        .filter((r) => r.tick.checked && r.text.value.trim())
        .map((r) => ({ ...r.item, answer: r.text.value.trim() }));
      actions.save(picked);
    };
    const parts: HTMLElement[] = [make('p', 'title', t('learn.title')), make('p', 'note', t('learn.hint')), list];
    if (items.some((i) => /\{(company|position)\}/.test(i.answer)))
      parts.push(make('p', 'note', t('learn.placeholders')));
    const buttons = make('div', 'actions');
    buttons.append(button(t('save'), save), button(t('cancel'), fold, 'quiet'));
    parts.push(buttons);
    card.replaceChildren(...parts);
    rows[0]?.text.focus();
  };

  fold();
  return card;
}
