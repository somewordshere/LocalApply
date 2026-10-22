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
  const storedProfile = () => worker.evaluate(() => chrome.storage.local.get('profile').then((r) => r.profile));
  // What the keyboard shortcut does: send `fill` to every frame of the active tab.
  const fillActiveTab = () =>
    worker.evaluate(async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      await chrome.tabs.sendMessage(tab.id, { type: 'fill' });
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

  await step('keyboard-shortcut path fills the page and reuses the saved answer', async () => {
    const page = await context.newPage();
    await page.goto('https://karriere.example.de/stelle/2');
    await page.bringToFront();
    await fillActiveTab();
    await page.waitForFunction(() => document.querySelector('#b')?.value === 'Muster');
    assert.equal(await page.inputValue('#z'), 'LinkedIn', 'answer saved from the popup is reused');
    await page.close();
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

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.getByRole('button', { name: 'Fill this page' }).waitFor();
    assert.equal(await popup.evaluate(() => document.documentElement.dataset.palette), 'ocean');
    await popup.close();

    await options.getByTitle('Forest').click();
    assert.equal(await accent(options), forest);
    await options.close();
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
