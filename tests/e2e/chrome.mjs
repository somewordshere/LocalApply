// End-to-end check of the built Chrome extension: profile page, popup, undo and shortcut path.
// Job pages are served from fixtures through request interception, so nothing goes to the network.
// Run with `npm run test:e2e`.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '../..');
const extension = join(root, '.output/chrome-mv3');
const fixture = (name) => readFileSync(join(root, 'tests/fixtures', name), 'utf8');

const GREENHOUSE_PAGE = `<!doctype html><html lang="en"><body>
  <form id="application_form">
    <label for="first_name">First Name *</label><input id="first_name" name="job_application[first_name]" required />
    <label for="last_name">Last Name *</label><input id="last_name" name="job_application[last_name]" required />
    <label for="email">Email *</label><input id="email" name="job_application[email]" required />
    <label for="phone">Phone</label><input id="phone" name="job_application[phone]" />
    <label for="resume">Resume/CV</label><input id="resume" type="file" />
    <label for="li">LinkedIn Profile</label><input id="li" />
    <label for="why">Why do you want to join us?</label><textarea id="why"></textarea>
    <label><input type="checkbox" name="consent" required /> I agree to the privacy policy</label>
    <button type="submit">Submit application</button>
  </form>
  <script>window.submitted = false; document.forms[0].addEventListener('submit', (e) => { e.preventDefault(); window.submitted = true; });</script>
</body></html>`;

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`ok    ${name}`);
  } catch (error) {
    results.push(`FAIL  ${name}\n      ${String(error.message).split('\n').join('\n      ')}`);
  }
}

const userData = mkdtempSync(join(tmpdir(), 'jaf-e2e-'));
const cvPath = join(userData, 'cv.pdf');
writeFileSync(cvPath, '%PDF-1.4 e2e test');

const context = await chromium.launchPersistentContext(userData, {
  channel: 'chromium',
  headless: true,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});

try {
  await context.route('https://boards.greenhouse.io/**', (route) =>
    route.fulfill({ contentType: 'text/html; charset=utf-8', body: GREENHOUSE_PAGE }),
  );
  await context.route('https://karriere.example.de/**', (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: fixture('generic-de.html').replace(
        '</form>',
        '<label for="z">Wie haben Sie von uns erfahren?</label><input id="z" /></form>',
      ),
    }),
  );

  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(worker.url()).host;
  // The active profile, as the extension stores it since 0.8.0 (one key per profile, plus an index).
  const storedProfile = () =>
    worker.evaluate(async () => {
      const { profileIndex } = await chrome.storage.local.get('profileIndex');
      const key = `profile:${profileIndex.active}`;
      return (await chrome.storage.local.get(key))[key];
    });
  // What the keyboard shortcut does: send `fill` to every frame of the active tab.
  const fillActiveTab = () =>
    worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'fill' });
    });

  await step('installing opens the welcome page, which leads to the profile page', async () => {
    // The tab may already exist, still loading, by the time this runs; look for it rather than wait for a new one.
    let welcome;
    for (let tries = 0; !welcome && tries < 50; tries++) {
      welcome = context.pages().find((page) => page.url() === `chrome-extension://${extensionId}/welcome.html`);
      if (!welcome) await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(welcome, 'the welcome page opened by itself');
    await welcome.getByRole('heading', { name: 'Welcome to LocalApply' }).waitFor();
    await welcome.getByText('Alt+Shift+F').waitFor();
    const opened = context.waitForEvent('page');
    await welcome.getByRole('button', { name: 'Set up your profile' }).first().click();
    const options = await opened;
    await options.waitForURL(`chrome-extension://${extensionId}/options.html`);
    await options.getByText(/^Start here:/).waitFor();
    await options.close();
    await welcome.close();
  });

  await step('profile page saves details and the CV', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.getByLabel('First name', { exact: true }).fill('Max');
    await options.getByLabel('Last name', { exact: true }).fill('Muster');
    await options.getByLabel('Email', { exact: true }).fill('max@example.com');
    await options.getByLabel('Country code', { exact: true }).fill('+49');
    await options.getByLabel('Number', { exact: true }).fill('151 2345678');
    await options.getByLabel('Street', { exact: true }).fill('Hauptstr.');
    await options.getByLabel('House number', { exact: true }).fill('5');
    await options.getByLabel('Postcode', { exact: true }).fill('10115');
    await options.getByLabel('City', { exact: true }).fill('Berlin');
    await options.getByLabel('Country', { exact: true }).fill('Germany');
    await options.getByLabel('LinkedIn', { exact: true }).fill('https://www.linkedin.com/in/max');
    await options.getByLabel('Salary expectation', { exact: true }).fill('65000');
    await options.getByLabel('Salutation').selectOption('Mr');
    await options.locator('input[type=file]').first().setInputFiles(cvPath);
    await options.getByText('cv.pdf').waitFor();
    await options.getByText('All changes saved').waitFor();
    const profile = await storedProfile();
    assert.equal(profile.firstName, 'Max');
    assert.equal(profile.salaryAmount, '65000');
    assert.equal(profile.cv.name, 'cv.pdf');
    await options.close();
  });

  await step('fills a Greenhouse form, attaches the CV, does not submit, and undoes from the notice', async () => {
    const page = await context.newPage();
    await page.goto('https://boards.greenhouse.io/acme/jobs/1');
    await page.bringToFront();
    await page.waitForTimeout(2000);
    assert.equal(await page.getByRole('button', { name: 'Fill application' }).count(), 0, 'no floating button');
    await fillActiveTab();
    const notice = page.getByRole('status').filter({ hasText: 'Filled' });
    await notice.waitFor();
    assert.equal(await page.inputValue('#first_name'), 'Max');
    assert.equal(await page.inputValue('#last_name'), 'Muster');
    assert.equal(await page.inputValue('#email'), 'max@example.com');
    assert.equal(await page.inputValue('#phone'), '+49 151 2345678');
    assert.equal(await page.inputValue('#li'), 'https://www.linkedin.com/in/max');
    assert.equal(await page.$eval('#resume', (el) => el.files[0]?.name), 'cv.pdf');
    assert.equal(await page.isChecked('[name=consent]'), false);
    assert.equal(await page.evaluate(() => window.submitted), false);
    assert.equal(await page.$eval('#first_name', (el) => el.style.outlineStyle), 'solid');
    assert.equal(await page.$eval('#why', (el) => el.style.outlineStyle), '', 'optional open question is not outlined');

    await notice.getByRole('button', { name: 'Undo' }).click();
    await page.getByRole('status').filter({ hasText: 'Undid' }).waitFor();
    assert.equal(await page.inputValue('#first_name'), '');
    assert.equal(await page.inputValue('#phone'), '');
    assert.equal(await page.$eval('#resume', (el) => el.files.length), 0);
    assert.equal(await page.$eval('#first_name', (el) => el.style.outlineStyle), '');
    await page.close();
  });

  await step('popup fills the active tab and lists what is left', async () => {
    const job = await context.newPage();
    await job.goto('https://karriere.example.de/stelle/1');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await job.bringToFront();
    await popup.getByRole('button', { name: 'Fill this page' }).click();
    await popup.getByText(/\d+ filled/).waitFor();
    assert.equal(await job.inputValue('#a'), 'Max');
    assert.equal(await job.inputValue('#v'), 'DE');
    assert.equal(await job.inputValue('#d'), '151 2345678');
    assert.equal(await job.inputValue('#e'), 'Hauptstr.');
    assert.equal(await job.inputValue('#anrede'), 'm');
    assert.equal(await job.inputValue('#k'), '65000 EUR');
    await popup.getByText('Not in your profile yet').waitFor();

    await popup.getByRole('button', { name: 'Save answer' }).first().click();
    await popup.getByPlaceholder('Your answer').fill('LinkedIn');
    await popup.getByRole('button', { name: 'Save', exact: true }).click();
    await popup.getByText('Saved').waitFor();
    assert.deepEqual(
      (await storedProfile()).customAnswers.map((a) => [a.keywords, a.answer]),
      [['Wie haben Sie von uns erfahren?', 'LinkedIn']],
    );

    await popup.getByRole('button', { name: 'Undo fill' }).click();
    await popup.getByText('Fill undone.').waitFor();
    await job.waitForFunction(() => document.querySelector('#a')?.value === '');
    assert.equal(await job.inputValue('#k'), '');
    await popup.close();
    await job.close();
  });

  await step('a second profile is created on the profile page and chosen in the popup', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.getByRole('button', { name: 'New profile' }).click();
    await options.getByLabel('Profile name').fill('Second');
    await options.getByLabel('Start as a copy of this profile').uncheck();
    await options.getByRole('button', { name: 'Create' }).click();
    // The page now shows the new, empty profile.
    await options.waitForFunction(() => document.querySelector('input[type=email]')?.value === '');
    await options.getByLabel('First name', { exact: true }).fill('Erika');
    await options.getByText('All changes saved').waitFor();
    assert.equal((await storedProfile()).firstName, 'Erika');

    const job = await context.newPage();
    await job.goto('https://karriere.example.de/stelle/3');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await job.bringToFront();
    const choice = popup.getByLabel('Profile', { exact: true });
    assert.equal(
      await choice.inputValue(),
      await worker.evaluate(() => chrome.storage.local.get('profileIndex').then((r) => r.profileIndex.active)),
    );
    await popup.getByRole('button', { name: 'Fill this page' }).click();
    await job.waitForFunction(() => document.querySelector('#a')?.value === 'Erika');

    // Back to the first profile, which the profile page follows.
    await choice.selectOption({ label: 'Main' });
    await options.waitForFunction(() => document.querySelector('input[type=email]')?.value === 'max@example.com');
    assert.equal((await storedProfile()).firstName, 'Max');
    await popup.close();
    await job.close();
    await options.close();
  });

  await step('keyboard-shortcut path fills the page and reuses the saved answer', async () => {
    const page = await context.newPage();
    await page.goto('https://karriere.example.de/stelle/2');
    await page.bringToFront();
    await fillActiveTab();
    await page.waitForFunction(() => document.querySelector('#b')?.value === 'Muster');
    assert.equal(await page.inputValue('#z'), 'LinkedIn', 'answer saved from the popup is reused');
    await page.close();
  });

  await step('a form in an iframe gets {company} and {position} from the posting around it', async () => {
    await context.route('https://jobs.example.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><head><title>Careers</title>
          <script type="application/ld+json">{"@type":"JobPosting","title":"QA Engineer","hiringOrganization":{"name":"Acme"}}</script>
          </head><body><h1>QA Engineer</h1><iframe src="https://forms.example.org/apply" width="600" height="300"></iframe></body></html>`,
      }),
    );
    await context.route('https://forms.example.org/**', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body><form><label for="cl">Cover letter</label><textarea id="cl"></textarea></form></body></html>',
      }),
    );
    await worker.evaluate(async () => {
      const { profileIndex } = await chrome.storage.local.get('profileIndex');
      const key = `profile:${profileIndex.active}`;
      const { [key]: profile } = await chrome.storage.local.get(key);
      await chrome.storage.local.set({
        [key]: { ...profile, coverLetterText: 'Dear {company} team, about the {position} role.' },
      });
    });
    const page = await context.newPage();
    await page.goto('https://jobs.example.com/acme/qa');
    await page.bringToFront();
    // What the popup and the shortcut do (src/core/fill.ts): ask the top frame for the job, then fill every frame.
    await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      const job = await chrome.tabs.sendMessage(tab.id, { type: 'read-job' }, { frameId: 0 });
      await chrome.tabs.sendMessage(tab.id, { type: 'fill', job });
    });
    const form = page.frameLocator('iframe').locator('#cl');
    await form.evaluate(
      (el) =>
        new Promise((resolve) => {
          const check = () => (el.value ? resolve() : setTimeout(check, 50));
          check();
        }),
    );
    assert.equal(await form.inputValue(), 'Dear Acme team, about the QA Engineer role.');
    await page.close();
  });

  await step('the application log notes the fill and shows it on the profile page', async () => {
    // The background waits for every frame to report before logging; poll for the entry.
    let entry;
    for (let tries = 0; !entry && tries < 40; tries++) {
      const log = await worker.evaluate(() =>
        chrome.storage.local.get('applicationLog').then((r) => r.applicationLog ?? []),
      );
      entry = log.find((a) => a.url === 'https://jobs.example.com/acme/qa');
      if (!entry) await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(entry, 'the iframe fill was logged');
    assert.equal(entry.company, 'Acme');
    assert.equal(entry.position, 'QA Engineer');

    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html#applications`);
    await options.getByRole('cell', { name: 'Acme', exact: true }).waitFor();
    await options.getByLabel('Keep a log of the applications I fill').uncheck();
    assert.equal(
      await worker.evaluate(() => chrome.storage.local.get('logApplications').then((r) => r.logApplications)),
      false,
    );
    await options.getByLabel('Keep a log of the applications I fill').check();
    await options.close();
  });

  await step('the popup says when the log holds an earlier application to the same employer', async () => {
    // Another posting of the same employer (the route above serves Acme's posting for every path).
    const job = await context.newPage();
    await job.goto('https://jobs.example.com/acme/developer');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    // The popup looks at the active tab when it opens: open it again while the posting is in front.
    await job.bringToFront();
    await popup.reload();
    await popup.getByText('You applied to Acme before').waitFor();
    await popup.getByText(/QA Engineer/).waitFor();
    await popup.close();
    await job.close();
  });

  await step('work experience: jobs are added, reordered and saved as a list', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html#experience`);
    const job = (n) => options.getByRole('listitem', { name: `Job ${n}`, exact: true });
    await options.getByRole('button', { name: 'Add job' }).click();
    await job(1).getByLabel('Job title').fill('Tester');
    await job(1).getByLabel('Employer').fill('Acme');
    await options.getByRole('button', { name: 'Add job' }).click();
    await job(2).getByLabel('Job title').fill('QA Engineer');
    await job(2).getByLabel('Employer').fill('Brightline');
    await job(2).getByLabel('I currently work here').check();
    await options.getByRole('button', { name: 'Move up: Job 2' }).click();
    await options.getByText('All changes saved').waitFor();
    const profile = await storedProfile();
    assert.deepEqual(
      profile.experience.map((j) => [j.title, j.employer, j.current]),
      [
        ['QA Engineer', 'Brightline', true],
        ['Tester', 'Acme', false],
      ],
    );
    await options.close();
  });

  await step('profile page links the phone boxes: a full number fills code and number, and back', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    const code = options.getByLabel('Country code', { exact: true });
    const number = options.getByLabel('Number', { exact: true });
    const full = options.getByLabel('Full number', { exact: true });
    assert.equal(await full.inputValue(), '+49 151 2345678');

    await full.fill('+48791532218');
    assert.equal(await code.inputValue(), '+48');
    assert.equal(await number.inputValue(), '791532218');
    await options.getByText('All changes saved').waitFor();
    let profile = await storedProfile();
    assert.equal(profile.phoneCountryCode, '+48');
    assert.equal(profile.phoneNumber, '791532218');

    await code.fill('+49');
    await number.fill('151 2345678');
    assert.equal(await full.inputValue(), '+49 151 2345678');
    await options.getByText('All changes saved').waitFor();
    profile = await storedProfile();
    assert.equal(profile.phoneCountryCode, '+49');
    assert.equal(profile.phoneNumber, '151 2345678');
    await options.close();
  });

  await step('language switch translates the profile page and the popup', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await options.getByRole('combobox', { name: 'Language' }).selectOption('pl');
    await options.getByRole('heading', { name: 'Twój profil' }).waitFor();
    await options.getByLabel('Imię', { exact: true }).waitFor();
    assert.equal(await options.evaluate(() => document.documentElement.lang), 'pl');
    assert.equal(await worker.evaluate(() => chrome.storage.local.get('uiLanguage').then((r) => r.uiLanguage)), 'pl');

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByRole('button', { name: 'Wypełnij tę stronę' }).waitFor();
    await popup.close();

    await options.getByRole('combobox', { name: 'Język' }).selectOption('en');
    await options.getByRole('heading', { name: 'Your profile' }).waitFor();
    await options.close();
  });

  await step('colour palette applies to the profile page and the popup', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    const accent = (page) =>
      page.evaluate(() =>
        globalThis.getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
      );
    const forest = await accent(options);
    // The radio itself is visually hidden; people click its swatch.
    await options.getByTitle('Ocean').click();
    assert.equal(await options.getByRole('radio', { name: 'Ocean' }).isChecked(), true);
    assert.notEqual(await accent(options), forest);
    assert.equal(await worker.evaluate(() => chrome.storage.local.get('uiPalette').then((r) => r.uiPalette)), 'ocean');
    // The logo follows; the toolbar icon is set by the background script from the same setting.
    await options.locator('img[src="/icon/ocean/48.png"]').waitFor();

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByRole('button', { name: 'Fill this page' }).waitFor();
    assert.equal(await popup.evaluate(() => document.documentElement.dataset.palette), 'ocean');
    await popup.close();

    await options.getByTitle('Forest').click();
    assert.equal(await accent(options), forest);
    await options.close();
  });

  await step('theme switch forces light or dark, and System follows the system', async () => {
    const options = await context.newPage();
    await options.emulateMedia({ colorScheme: 'light' });
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    const scheme = (page) => page.evaluate(() => document.documentElement.dataset.scheme);
    const paper = (page) => page.evaluate(() => globalThis.getComputedStyle(document.body).backgroundColor);
    assert.equal(await scheme(options), 'light');
    const light = await paper(options);

    await options.getByText('Dark', { exact: true }).click();
    assert.equal(await scheme(options), 'dark');
    assert.notEqual(await paper(options), light);
    assert.equal(await worker.evaluate(() => chrome.storage.local.get('uiTheme').then((r) => r.uiTheme)), 'dark');

    const popup = await context.newPage();
    await popup.emulateMedia({ colorScheme: 'light' });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByRole('button', { name: 'Fill this page' }).waitFor();
    assert.equal(await scheme(popup), 'dark');
    await popup.close();

    await options.getByText('System', { exact: true }).click();
    assert.equal(await scheme(options), 'light');
    await options.emulateMedia({ colorScheme: 'dark' });
    await options.waitForFunction(() => document.documentElement.dataset.scheme === 'dark');
    await options.emulateMedia({ colorScheme: 'light' });
    await options.getByText('Light', { exact: true }).click();
    assert.equal(await paper(options), light);
    await options.close();
  });

  await step('an answer typed into the form after a fill is offered, edited and saved', async () => {
    const page = await context.newPage();
    await page.goto('https://boards.greenhouse.io/acme/jobs/1');
    await page.bringToFront();
    await fillActiveTab();
    await page.getByRole('status').filter({ hasText: 'Filled' }).waitFor();
    await page.fill('#why', 'I have used the product for years.');
    await page.press('#why', 'Tab');
    const card = page.getByRole('region', { name: 'Save these answers for next time?' });
    await card.getByText('You answered 1 new question. Save it for next time?').waitFor();
    await card.getByRole('button', { name: 'Review' }).click();
    await card.getByLabel('Answer for Why do you want to join us?').fill('I have used the product since 2020.');
    await card.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Saved 1 answer' }).waitFor();
    assert.deepEqual(
      (await storedProfile()).customAnswers.find((a) => a.keywords === 'Why do you want to join us?')?.answer,
      'I have used the product since 2020.',
    );
    // Leaving the box again offers nothing: the answer is saved.
    await page.focus('#why');
    await page.press('#why', 'Tab');
    await page.waitForTimeout(300);
    assert.equal(await card.count(), 0);
    await page.close();
  });

  await step('"Fill this field with" puts the chosen text into the right-clicked box', async () => {
    const page = await context.newPage();
    await page.goto('https://boards.greenhouse.io/acme/jobs/2');
    await page.bringToFront();
    await page.click('#why', { button: 'right' }).catch(() => {});
    await page.keyboard.press('Escape');
    // What the background does when a menu item is chosen (entrypoints/background.ts).
    await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'fill-field', value: 'Hello {company}', job: { company: 'Acme' } });
    });
    await page.waitForFunction(() => document.querySelector('#why')?.value === 'Hello Acme');
    assert.equal(await page.inputValue('#first_name'), '', 'only the clicked box');
    await page.close();
  });

  // A two-page application: page 1 swaps in a second step without loading (like Workday), then links to page 2.
  await context.route('https://steps.example.com/**', (route) => {
    const second = route.request().url().endsWith('/2');
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: second
        ? '<!doctype html><html><body><form><label for="city">City</label><input id="city"></form></body></html>'
        : `<!doctype html><html><body><form id="f"><label for="fn">First name</label><input id="fn">
           <button type="button" id="next">Continue</button></form>
           <script>document.getElementById('next').onclick = () => {
             document.getElementById('f').innerHTML = '<label for="em">Email</label><input id="em"><a id="page2" href="/apply/2">Next page</a>';
           };</script></body></html>`,
    });
  });

  await step('after a fill, the next steps of the same application are filled as they appear', async () => {
    const page = await context.newPage();
    await page.goto('https://steps.example.com/apply/1');
    await page.bringToFront();
    await fillActiveTab();
    await page.waitForFunction(() => document.querySelector('#fn')?.value === 'Max');
    // A step that replaces the form on the same page.
    await page.click('#next');
    await page.waitForFunction(() => document.querySelector('#em')?.value === 'max@example.com');
    await page.getByRole('status').filter({ hasText: 'Next step: filled 1 field' }).waitFor();
    // A step on a new page of the same site.
    await page.click('#page2');
    await page.waitForFunction(() => document.querySelector('#city')?.value === 'Berlin');
    // Only the first fill is an application in the log.
    const log = await worker.evaluate(() => chrome.storage.local.get('applicationLog').then((r) => r.applicationLog));
    assert.equal(log.filter((a) => a.url.startsWith('https://steps.example.com/')).length, 1);
    await page.close();
  });

  await step('the popup adds the job blocks a form is missing and fills them', async () => {
    await context.route('https://blocks.example.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html><body><form><h2>Work experience</h2><div id="jobs">
          <label for="e0">Employer</label><input id="e0"></div>
          <button type="button" id="add">+ Add another job</button></form>
          <script>let n = 1; document.getElementById('add').onclick = () => document.getElementById('jobs')
            .insertAdjacentHTML('beforeend', '<label for="e' + n + '">Employer</label><input id="e' + n++ + '">');</script>
          </body></html>`,
      }),
    );
    const job = await context.newPage();
    await job.goto('https://blocks.example.com/apply');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await job.bringToFront();
    await popup.getByRole('button', { name: 'Fill this page' }).click();
    await popup.getByText('This form has room for 1 of your 2 jobs.').waitFor();
    await popup.getByRole('button', { name: 'Add 1 more and fill' }).click();
    await job.waitForFunction(() => document.querySelector('#e1')?.value === 'Acme');
    assert.equal(await job.inputValue('#e0'), 'Brightline');
    await popup.getByText("Why wasn't something filled?").click();
    await popup.getByText('currentEmployer').first().waitFor();
    await popup.close();
    await job.close();
  });

  await step('the log keeps a status and notes for each application', async () => {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html#applications`);
    await options
      .getByRole('combobox', { name: 'Status of the application to Acme' })
      .first()
      .selectOption('interview');
    await options.getByRole('row').filter({ hasText: 'Acme' }).first().getByRole('button', { name: 'Details' }).click();
    await options.getByLabel('Notes').fill('Call Kim on Monday');
    await options.getByRole('button', { name: 'Hide' }).click();
    let entry;
    for (let tries = 0; !entry?.notes && tries < 30; tries++) {
      const log = await worker.evaluate(() => chrome.storage.local.get('applicationLog').then((r) => r.applicationLog));
      entry = log.find((a) => a.company === 'Acme');
      if (!entry?.notes) await new Promise((r) => setTimeout(r, 100));
    }
    assert.equal(entry.status, 'interview');
    assert.equal(entry.notes, 'Call Kim on Monday');
    await options.close();
  });

  await step('"Save what\'s in this field as an answer" saves without a fill', async () => {
    await context.route('https://save.example.com/**', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html><body><form><label for="q">What motivates you?</label><textarea id="q"></textarea></form></body></html>',
      }),
    );
    const page = await context.newPage();
    await page.goto('https://save.example.com/form');
    await page.bringToFront();
    await page.fill('#q', 'Shipping things people use.');
    await page.click('#q', { button: 'right' }).catch(() => {});
    await page.keyboard.press('Escape');
    // What the background does when the menu item is chosen.
    await worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'save-field' });
    });
    await page.getByRole('status').filter({ hasText: 'Saved 1 answer' }).waitFor();
    const answers = (await storedProfile()).customAnswers;
    assert.ok(answers.some((a) => a.keywords === 'What motivates you?' && a.answer === 'Shipping things people use.'));
    await page.close();
  });

  await step('the welcome page has a practice form that fills from the profile', async () => {
    const welcome = await context.newPage();
    await welcome.goto(`chrome-extension://${extensionId}/welcome.html`);
    await welcome.getByRole('button', { name: 'Fill this practice form' }).click();
    const form = welcome.getByRole('form', { name: 'Try it here' });
    await welcome.waitForFunction(() => document.querySelector('[name="first_name"]')?.value === 'Max');
    assert.equal(await form.locator('[name="email"]').inputValue(), 'max@example.com');
    await welcome.getByRole('button', { name: 'Clear' }).click();
    assert.equal(await form.locator('[name="first_name"]').inputValue(), '');
    // The language box above the form is left alone.
    assert.equal(await welcome.getByRole('combobox', { name: 'Language' }).inputValue(), 'en');
    await welcome.close();
  });

  await step('no button and no errors on an ordinary page', async () => {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('https://news.example.com/**', (route) =>
      route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<p>hello</p><input type="search">' }),
    );
    await page.goto('https://news.example.com/');
    await page.waitForTimeout(2000);
    assert.equal(await page.getByRole('button', { name: 'Fill application' }).count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  });
} finally {
  await context.close();
  rmSync(userData, { recursive: true, force: true });
}

console.log(results.join('\n'));
if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
