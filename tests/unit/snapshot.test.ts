import { describe, expect, it } from 'vitest';
import { readJob } from '../../src/engine/job';
import { learnFrom, noteAnswersUsed } from '../../src/engine/learn';
import { snapshot } from '../../src/engine/snapshot';
import { profile } from './helpers';

describe('a copy of the form for a bug report', () => {
  it('keeps structure, labels, names and ids, and drops values, scripts, media, links and our notice', () => {
    document.head.innerHTML = '<script>track()</script><style>p{}</style>';
    document.body.innerHTML = `<form action="/apply?token=abc">
      <label for="n">Name</label><input id="n" name="name" value="Max" data-automation-id="legalName">
      <input type="hidden" name="csrf" value="secret">
      <input type="checkbox" checked name="agree"><select name="c"><option selected>Germany</option></select>
      <textarea name="why">I typed this</textarea><div contenteditable="true">Rich text</div>
      <img src="https://tracker.example/p.gif"><a href="https://x.example/?session=1">Help</a>
      <button onclick="go()">Send</button></form><div id="localapply-ui"></div>`;
    (document.getElementById('n') as HTMLInputElement).value = 'Typed later';
    const html = snapshot(document);
    expect(html).toContain('<label for="n">Name</label>');
    expect(html).toContain('name="name"');
    expect(html).toContain('data-automation-id="legalName"');
    expect(html).toContain('<option>Germany</option>');
    for (const gone of ['Max', 'Typed later', 'secret', 'token', 'checked', 'I typed this', 'Rich text', 'track()']) {
      expect(html).not.toContain(gone);
    }
    for (const gone of ['<script', '<style', '<img', 'href=', 'onclick', 'localapply-ui', 'selected']) {
      expect(html).not.toContain(gone);
    }
  });
});

describe('learning choices', () => {
  it('learns the chosen option of a dropdown, but not its prompt', () => {
    document.body.innerHTML = `<label for="q">Preferred team</label>
      <select id="q"><option value="">Please select</option><option value="p">Platform</option></select>`;
    const select = document.getElementById('q') as HTMLSelectElement;
    expect(learnFrom(select, profile)).toBeNull();
    select.value = 'p';
    expect(learnFrom(select, profile)).toEqual({ label: 'Preferred team', answer: 'Platform' });
  });

  it('learns a radio group by its question and the chosen option', () => {
    document.body.innerHTML = `<form><fieldset><legend>Preferred shift</legend>
      <label><input type="radio" name="s" value="e"> Early</label><label><input type="radio" name="s" value="l"> Late</label>
      </fieldset></form>`;
    const late = document.querySelector<HTMLInputElement>('[value="l"]')!;
    late.checked = true;
    expect(learnFrom(late, profile)).toEqual({ label: 'Preferred shift', answer: 'Late' });
  });

  it('leaves profile questions asked as choices to the profile', () => {
    document.body.innerHTML = `<form><fieldset><legend>Will you require visa sponsorship?</legend>
      <label><input type="radio" name="v" value="y"> Yes</label><label><input type="radio" name="v" value="n"> No</label>
      </fieldset></form>`;
    const yes = document.querySelector<HTMLInputElement>('[value="y"]')!;
    yes.checked = true;
    expect(learnFrom(yes, profile)).toBeNull();
  });

  it('counts each use of a saved answer', () => {
    const now = new Date(Date.UTC(2026, 9, 28));
    const once = noteAnswersUsed(profile, ['1'], now);
    const twice = noteAnswersUsed(once, ['1', 'unknown'], now);
    expect(twice.customAnswers[0]).toMatchObject({ uses: 2, lastUsed: now.toISOString() });
  });
});

describe('the job description', () => {
  it('is read from schema.org data as plain text with its paragraphs', () => {
    document.head.innerHTML = `<script type="application/ld+json">{"@type":"JobPosting","title":"QA Engineer",
      "hiringOrganization":{"name":"Acme"},"description":"<p>You test things.</p><ul><li>Write tests</li><li>Find bugs</li></ul>"}</script>`;
    document.body.innerHTML = '<h1>QA Engineer</h1>';
    expect(readJob(document).description).toBe('You test things.\nWrite tests\nFind bugs');
  });
});
