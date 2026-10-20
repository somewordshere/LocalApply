// Renders the store images from the real built extension.
//   store/screenshots/*.png             1280x800, used by both stores
//   store/chrome/promo-tile-440x280.png Chrome Web Store small promo tile
// Run with `npm run store-assets` (builds first). The first run needs `npx playwright install chromium`.
//
// Screenshots show the extension at its real size inside a plain browser frame, with the popup
// opening under its toolbar button. They carry no marketing text: Mozilla asks for text-free
// screenshots because one set is shown in every language; captions live in store/*/listing.*.md.
// Job pages, companies and the person are fictional; pages are served through request interception.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const extension = join(root, '.output/chrome-mv3');
const outDir = join(root, 'store/screenshots');
const chromeDir = join(root, 'store/chrome');
mkdirSync(outDir, { recursive: true });
mkdirSync(chromeDir, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 800;
const CHROME_HEIGHT = 82; // tab strip + toolbar drawn by frame()
const PAGE = { width: WIDTH, height: HEIGHT - CHROME_HEIGHT };
const POPUP_WIDTH = 360;

const PROFILE = {
  version: 1,
  salutation: 'Mr',
  firstName: 'Alex',
  lastName: 'Morgan',
  email: 'alex.morgan@example.com',
  phoneCountryCode: '+49',
  phoneNumber: '151 23456789',
  dateOfBirth: '1992-05-14',
  nationality: 'German',
  street: 'Torstraße',
  houseNumber: '112',
  postcode: '10119',
  city: 'Berlin',
  state: 'Berlin',
  country: 'Germany',
  linkedin: 'https://www.linkedin.com/in/alexmorgan',
  github: 'https://github.com/alexmorgan',
  website: 'https://alexmorgan.example.com',
  xing: '',
  salaryAmount: '68000',
  salaryCurrency: 'EUR',
  salaryPeriod: 'year',
  noticePeriod: '3 months',
  startDate: '2027-01-01',
  workAuthorized: 'yes',
  needsSponsorship: 'no',
  willingToRelocate: 'yes',
  remotePreference: 'Hybrid',
  yearsOfExperience: '6',
  currentTitle: 'QA Engineer',
  currentEmployer: 'Brightline Software',
  school: 'TU Berlin',
  degree: 'M.Sc.',
  fieldOfStudy: 'Computer Science',
  coverLetterText:
    'Dear Northwind team,\n\nI have spent six years building test automation for web and embedded products and would love to bring that experience to your platform team.',
  cv: {
    name: 'Alex_Morgan_CV.pdf',
    type: 'application/pdf',
    dataUrl: `data:application/pdf;base64,${Buffer.from('%PDF-1.4 demo').toString('base64')}`,
  },
  coverLetterFile: null,
  customAnswers: [
    {
      id: 'demo',
      keywords: 'why do you want to join, why us',
      answer:
        'Your platform team works on exactly the testing problems I enjoy most, and I would like to help you ship faster with fewer regressions.',
    },
  ],
  gender: '',
  disability: '',
  veteran: '',
};

const FORM_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #f1f5f9; }
  .top { background: var(--brand); color: #fff; padding: 16px 40px; font-weight: 600; font-size: 16px; }
  .top small { font-weight: 400; opacity: .8; margin-left: 12px; font-size: 14px; }
  main { max-width: 980px; margin: 24px auto; background: #fff; border-radius: 14px; padding: 28px 36px; box-shadow: 0 1px 3px rgba(15,23,42,.08); }
  h1 { font-size: 24px; margin: 0 0 2px; }
  .sub { color: #64748b; margin: 0 0 20px; }
  form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 24px; }
  label, legend { display: block; font-weight: 600; font-size: 14px; margin-bottom: 5px; }
  input:not([type=radio]):not([type=file]), textarea, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 9px 11px; font: inherit; background: #fff; }
  textarea { height: 76px; resize: none; }
  .wide { grid-column: 1 / -1; }
  fieldset { border: 0; margin: 0; padding: 0; }
  .choices { display: flex; gap: 20px; }
  .choices label { font-weight: 400; display: flex; gap: 7px; align-items: center; margin: 0; padding: 2px 6px 2px 2px; }
  .drop { border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 10px 12px; color: #475569; display: flex; align-items: center; gap: 10px; }
  .drop input { display: none; }
  .drop b { color: var(--brand); }
  .req { color: #dc2626; }
`;

const page = ({ lang, title, brand, company, area, heading, sub, form }) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${title}</title>
  <style>${FORM_CSS} :root { --brand: ${brand}; }</style></head><body>
  <div class="top">${company} <small>${area}</small></div>
  <main><h1>${heading}</h1><p class="sub">${sub}</p><form>${form}</form></main>
  <script>for (const input of document.querySelectorAll('.drop input')) input.addEventListener('change', (e) => {
    e.target.nextElementSibling.textContent = '📄 ' + e.target.files[0].name; });</script>
  </body></html>`;

const PAGES = {
  northwind: {
    url: 'https://careers.northwind.example/jobs/senior-qa-engineer/apply',
    html: page({
      lang: 'en',
      title: 'Senior QA Engineer · Northwind Labs',
      brand: '#0f766e',
      company: 'Northwind Labs',
      area: 'Careers',
      heading: 'Senior QA Engineer',
      sub: 'Berlin · Hybrid · Full-time',
      form: `
        <div><label for="fn">First name <span class="req">*</span></label><input id="fn" required></div>
        <div><label for="ln">Last name <span class="req">*</span></label><input id="ln" required></div>
        <div><label for="em">Email <span class="req">*</span></label><input id="em" type="email" required></div>
        <div><label for="ph">Phone <span class="req">*</span></label><input id="ph" type="tel" required></div>
        <div><label for="li">LinkedIn profile</label><input id="li"></div>
        <div><label for="gh">GitHub</label><input id="gh"></div>
        <div><label for="sal">Salary expectation (yearly, gross) <span class="req">*</span></label><input id="sal" required></div>
        <div><label for="np">Notice period</label><input id="np"></div>
        <fieldset><legend>Are you authorized to work in Germany? <span class="req">*</span></legend>
          <div class="choices"><label><input type="radio" name="auth"> Yes</label><label><input type="radio" name="auth"> No</label></div></fieldset>
        <div><label for="cv">Resume / CV <span class="req">*</span></label>
          <div class="drop"><input id="cv" type="file" required><span>Drop your file here or <b>browse</b></span></div></div>
        <div class="wide"><label for="hear">How did you hear about us? <span class="req">*</span></label><input id="hear" required></div>`,
    }),
  },
  brightwave: {
    url: 'https://jobs.brightwave-health.example/test-automation-engineer',
    html: page({
      lang: 'en',
      title: 'Test Automation Engineer · Brightwave Health',
      brand: '#7c3aed',
      company: 'Brightwave Health',
      area: 'Jobs',
      heading: 'Test Automation Engineer',
      sub: 'Remote (EU) · Full-time',
      form: `
        <div><label for="nm">Full name <span class="req">*</span></label><input id="nm" required></div>
        <div><label for="em">Email <span class="req">*</span></label><input id="em" type="email" required></div>
        <div><label for="sd">Earliest start date</label><input id="sd" type="date"></div>
        <fieldset><legend>Will you require visa sponsorship? <span class="req">*</span></legend>
          <div class="choices"><label><input type="radio" name="visa"> Yes</label><label><input type="radio" name="visa"> No</label></div></fieldset>
        <div class="wide"><label for="why">Why do you want to join Brightwave? <span class="req">*</span></label><textarea id="why" required></textarea></div>
        <div class="wide"><label for="hear">How did you hear about us? <span class="req">*</span></label>
          <select id="hear" required><option value="">Select…</option><option>LinkedIn</option><option>Job board</option><option>Referral</option><option>Other</option></select></div>`,
    }),
  },
  weber: {
    url: 'https://karriere.weber-sensorik.example/stellen/softwaretester',
    html: page({
      lang: 'de',
      title: 'Softwaretester (m/w/d) · Weber Sensorik',
      brand: '#1d4ed8',
      company: 'Weber Sensorik GmbH',
      area: 'Karriere',
      heading: 'Softwaretester (m/w/d)',
      sub: 'Stuttgart · Vollzeit · ab sofort',
      form: `
        <div><label for="an">Anrede</label><select id="an"><option value="">Bitte wählen</option><option>Frau</option><option>Herr</option><option>Divers</option></select></div>
        <div><label for="gd">Geburtsdatum</label><input id="gd" placeholder="TT.MM.JJJJ"></div>
        <div><label for="vn">Vorname <span class="req">*</span></label><input id="vn" required></div>
        <div><label for="nn">Nachname <span class="req">*</span></label><input id="nn" required></div>
        <div><label for="st">Straße</label><input id="st"></div>
        <div><label for="hn">Hausnummer</label><input id="hn"></div>
        <div><label for="plz">PLZ</label><input id="plz"></div>
        <div><label for="ort">Ort</label><input id="ort"></div>
        <div><label for="em">E-Mail-Adresse <span class="req">*</span></label><input id="em" required></div>
        <div><label for="tel">Telefonnummer</label><input id="tel"></div>
        <div><label for="geh">Gehaltsvorstellung (brutto/Jahr)</label><input id="geh"></div>
        <div><label for="ein">Frühester Eintrittstermin</label><input id="ein" placeholder="TT.MM.JJJJ"></div>`,
    }),
  },
};

// --- Capture -----------------------------------------------------------------------------------

const userData = mkdtempSync(join(tmpdir(), 'localapply-shots-'));
const context = await chromium.launchPersistentContext(userData, {
  channel: 'chromium',
  headless: true,
  deviceScaleFactor: 2,
  viewport: PAGE,
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});

const captures = {};
try {
  for (const { url, html } of Object.values(PAGES)) {
    await context.route(url, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }));
  }
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  await worker.evaluate((profile) => chrome.storage.local.set({ profile }), PROFILE);

  /** Opens a job page and fills it through the real popup. */
  const fill = async (url) => {
    const job = await context.newPage();
    await job.goto(url);
    const popup = await context.newPage();
    await popup.setViewportSize({ width: POPUP_WIDTH, height: 700 });
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await job.bringToFront();
    await popup.getByRole('button', { name: 'Fill this page' }).click();
    await popup.getByText(/\d+ filled/).waitFor();
    await job.getByRole('status').filter({ hasText: 'Filled' }).waitFor();
    await job.mouse.move(0, 0);
    return { job, popup };
  };
  const hideToast = (job) => job.evaluate(() => document.getElementById('localapply-ui')?.remove());

  // 1: one click fills the form; the popup reports what happened.
  {
    const { job, popup } = await fill(PAGES.northwind.url);
    await hideToast(job);
    captures.northwind = { page: await job.screenshot(), popup: await popup.locator('main').screenshot() };
    await popup.close();
    await job.close();
  }

  // 2: a saved answer filled "Why do you want to join?"; the popup offers to save the open question.
  {
    const { job, popup } = await fill(PAGES.brightwave.url);
    await hideToast(job);
    await popup.getByRole('button', { name: 'Save answer' }).first().click();
    await popup.getByPlaceholder('Your answer').fill('LinkedIn');
    captures.brightwave = { page: await job.screenshot(), popup: await popup.locator('main').screenshot() };
    await popup.close();
    await job.close();
  }

  // 3: a German form, with the on-page summary the extension shows after filling.
  {
    const { job, popup } = await fill(PAGES.weber.url);
    await popup.close();
    captures.weber = { page: await job.screenshot() };
    await job.close();
  }

  // 4 and 5: the profile page, top (personal details) and bottom (saved answers, export and delete).
  {
    const options = await context.newPage();
    await options.goto(`chrome-extension://${id}/options.html`);
    await options.getByText('All changes saved').waitFor();
    captures.profile = { page: await options.screenshot() };
    await options.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    captures.profileData = { page: await options.screenshot() };
    await options.close();
  }
} finally {
  await context.close();
  rmSync(userData, { recursive: true, force: true });
}

// --- Compose -----------------------------------------------------------------------------------

const dataUrl = (png) => `data:image/png;base64,${png.toString('base64')}`;
const toolbarIcon = dataUrl(readFileSync(join(root, 'public/icon/32.png')));

const ICON = {
  back: '<path d="M15 6l-6 6 6 6"/>',
  forward: '<path d="M9 6l6 6-6 6"/>',
  reload: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  puzzle:
    '<path d="M10 4h4v3a1.5 1.5 0 0 0 3 0V4h3v6h-3a1.5 1.5 0 0 0 0 3h3v7h-6v-3a1.5 1.5 0 0 0-3 0v3H4v-7h3a1.5 1.5 0 0 0 0-3H4V4h6z"/>',
  menu: '<path d="M5 7h14M5 12h14M5 17h14"/>',
};
const svg = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[name]}</svg>`;

const FRAME_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; background: #fff;
    font: 13px "Segoe UI", system-ui, sans-serif; color: #1f2937; position: relative; }
  .tabs { height: 38px; background: #e4e7ec; display: flex; align-items: flex-end; padding: 0 8px; }
  .tab { height: 32px; width: 280px; background: #fff; border-radius: 8px 8px 0 0; display: flex; align-items: center; gap: 8px;
    padding: 0 12px; font-size: 12.5px; white-space: nowrap; overflow: hidden; }
  .tab .fav { width: 14px; height: 14px; border-radius: 4px; flex: none; }
  .bar { height: 44px; display: flex; align-items: center; gap: 4px; padding: 0 8px; border-bottom: 1px solid #e2e8f0; color: #475569; }
  .btn { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 6px; }
  .btn.active { background: #dfece4; }
  .btn img { width: 18px; height: 18px; }
  .url { flex: 1; height: 32px; margin: 0 8px; border-radius: 8px; background: #f1f3f5; display: flex; align-items: center;
    gap: 8px; padding: 0 12px; font-size: 13.5px; color: #334155; }
  .url .muted { color: #94a3b8; }
  .page { position: absolute; left: 0; top: ${CHROME_HEIGHT}px; width: ${WIDTH}px; }
  .popup { position: absolute; top: ${CHROME_HEIGHT - 4}px; right: 52px; width: ${POPUP_WIDTH}px; border-radius: 8px; overflow: hidden;
    box-shadow: 0 12px 32px rgba(15,23,42,.28), 0 0 0 1px rgba(15,23,42,.12); background: #fff; }
  .popup img, .page img { display: block; width: 100%; }
`;

function frame({ title, favicon, url, page, popup }) {
  const [scheme, rest] = url.split('://');
  const shownUrl =
    scheme === 'https'
      ? `${svg('lock', 15)}<span>${rest}</span>`
      : `<span><span class="muted">${scheme}://</span>${rest}</span>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_CSS}</style></head><body>
    <div class="tabs"><div class="tab"><span class="fav" style="background:${favicon}"></span>${title}</div></div>
    <div class="bar">
      <span class="btn">${svg('back')}</span><span class="btn">${svg('forward')}</span><span class="btn">${svg('reload')}</span>
      <div class="url">${shownUrl}</div>
      <span class="btn${popup ? ' active' : ''}"><img src="${toolbarIcon}" alt=""></span>
      <span class="btn">${svg('puzzle')}</span><span class="btn">${svg('menu')}</span>
    </div>
    <div class="page"><img src="${dataUrl(page)}"></div>
    ${popup ? `<div class="popup"><img src="${dataUrl(popup)}"></div>` : ''}
  </body></html>`;
}

const OPTIONS_URL = 'moz-extension://localapply/options.html';
const SHOTS = {
  '1-fill-in-one-click': {
    title: 'Senior QA Engineer · Northwind Labs',
    favicon: '#0f766e',
    url: PAGES.northwind.url,
    ...captures.northwind,
  },
  '2-saved-answers': {
    title: 'Test Automation Engineer · Brightwave',
    favicon: '#7c3aed',
    url: PAGES.brightwave.url,
    ...captures.brightwave,
  },
  '3-any-language': {
    title: 'Softwaretester (m/w/d) · Weber Sensorik',
    favicon: '#1d4ed8',
    url: PAGES.weber.url,
    ...captures.weber,
  },
  '4-profile': { title: 'Your profile · LocalApply', favicon: '#1f6b4f', url: OPTIONS_URL, ...captures.profile },
  '5-answers-and-backup': {
    title: 'Your profile · LocalApply',
    favicon: '#1f6b4f',
    url: OPTIONS_URL,
    ...captures.profileData,
  },
};

const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  // Old screenshots may have other names; start from an empty folder.
  for (const name of readdirSync(outDir).filter((n) => n.endsWith('.png'))) rmSync(join(outDir, name));
  const shot = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  for (const [name, spec] of Object.entries(SHOTS)) {
    await shot.setContent(frame(spec));
    await shot.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    writeFileSync(join(outDir, `${name}.png`), await shot.screenshot());
  }

  // Chrome Web Store small promo tile: shown in search results and category pages. Chrome allows text here.
  const icon = dataUrl(readFileSync(join(root, 'public/icon/128.png')));
  const tile = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
  // Same paper, ink and green as the extension, with its heading typeface embedded (the tile is rendered offline).
  const fraunces = `data:font/woff2;base64,${readFileSync(
    join(root, 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2'),
  ).toString('base64')}`;
  await tile.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Fraunces; src: url(${fraunces}) format('woff2'); font-weight: 100 900; }
    body { margin: 0; width: 440px; height: 280px; overflow: hidden; font-family: "Segoe UI", system-ui, sans-serif;
      color: #1c1a16; background: #f3f0e8; display: flex; flex-direction: column; justify-content: center;
      padding: 0 38px; box-sizing: border-box; border-left: 6px solid #1f6b4f; }
    .row { display: flex; align-items: center; gap: 12px; }
    img { width: 44px; height: 44px; border-radius: 10px; }
    .name { font-family: Fraunces, Georgia, serif; font-size: 24px; font-weight: 600; letter-spacing: -.3px; }
    h1 { margin: 22px 0 0; font-family: Fraunces, Georgia, serif; font-size: 33px; line-height: 1.1; font-weight: 500;
      letter-spacing: -.6px; }
    small { display: block; margin-top: 14px; font-size: 14px; color: #5d574c; }
  </style></head><body>
    <div class="row"><img src="${icon}"><span class="name">LocalApply</span></div>
    <h1>Fill job applications<br>in one click</h1>
    <small>Private: your data stays in your browser</small>
  </body></html>`);
  await tile.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  writeFileSync(join(chromeDir, 'promo-tile-440x280.png'), await tile.screenshot());
} finally {
  await browser.close();
}
console.log(`Wrote ${Object.keys(SHOTS).length} screenshots to store/screenshots/ and the promo tile to store/chrome/`);
