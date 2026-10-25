// Renders the store images from the real built extension.
//   store/screenshots/*.png             1280x800, Firefox (addons.mozilla.org)
//   store/chrome/screenshots/*.png      1280x800, Chrome Web Store
//   store/chrome/promo-tile-440x280.png Chrome Web Store small promo tile
// Run with `npm run store-assets` (builds first). The first run needs `npx playwright install chromium`.
//
// The Firefox screenshots show the extension at its real size inside a plain browser frame, with the
// popup opening under its toolbar button. They carry no marketing text: Mozilla asks for text-free
// screenshots because one set is shown in every language; captions live in store/firefox/listing.*.md.
// Chrome shows no captions, so its screenshots are slides that say one thing each, with the real UI
// cropped and enlarged on the brand green.
// Job pages, companies and the person are fictional; pages are served through request interception.
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const extension = join(root, '.output/chrome-mv3');
const outDir = join(root, 'store/screenshots');
const chromeDir = join(root, 'store/chrome');
const slidesDir = join(chromeDir, 'screenshots');
mkdirSync(outDir, { recursive: true });
mkdirSync(slidesDir, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 800;
const CHROME_HEIGHT = 82; // tab strip + toolbar drawn by frame()
const PAGE = { width: WIDTH, height: HEIGHT - CHROME_HEIGHT };
const POPUP_WIDTH = 360;

const PROFILE = {
  version: 2,
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
  experience: [
    {
      id: 'w1',
      title: 'QA Engineer',
      employer: 'Brightline Software',
      location: 'Berlin',
      start: '2021-03',
      end: '',
      current: true,
      description: 'Test automation for web and embedded products.',
    },
    {
      id: 'w2',
      title: 'Software Tester',
      employer: 'Kestrel Systems',
      location: 'Hamburg',
      start: '2018-09',
      end: '2021-02',
      current: false,
      description: '',
    },
  ],
  educationLevel: "Master's degree",
  education: [
    {
      id: 'e1',
      school: 'TU Berlin',
      degree: 'M.Sc.',
      fieldOfStudy: 'Computer Science',
      start: '2015-10',
      end: '2017-09',
    },
  ],
  languages: [
    { id: 'l1', language: 'German', level: 'native' },
    { id: 'l2', language: 'English', level: 'C1' },
  ],
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
        <fieldset class="wide"><legend>Highest education level <span class="req">*</span></legend>
          <div class="choices"><label><input type="radio" name="edu"> High school</label><label><input type="radio" name="edu"> Bachelor’s degree</label><label><input type="radio" name="edu"> Master’s degree</label><label><input type="radio" name="edu"> PhD</label></div></fieldset>
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

  /** Opens a job page and fills it through the real popup, in English unless told otherwise. */
  const fill = async (
    url,
    { lang = 'en', button = 'Fill this page', filled = /\d+ filled/, notice = 'Filled' } = {},
  ) => {
    await worker.evaluate((uiLanguage) => chrome.storage.local.set({ uiLanguage }), lang);
    const job = await context.newPage();
    await job.goto(url);
    const popup = await context.newPage();
    await popup.setViewportSize({ width: POPUP_WIDTH, height: 700 });
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await job.bringToFront();
    await popup.getByRole('button', { name: button }).click();
    await popup.getByText(filled).waitFor();
    await job.getByRole('status').filter({ hasText: notice }).waitFor();
    await job.mouse.move(0, 0);
    return { job, popup };
  };
  const hideToast = (job) => job.evaluate(() => document.getElementById('localapply-ui')?.remove());
  /** The job page before filling, for the Chrome slides' before and after. */
  const blank = async (url) => {
    const job = await context.newPage();
    await job.goto(url);
    const png = await job.screenshot();
    await job.close();
    return png;
  };

  // 1: one click fills the form; the popup reports what happened.
  {
    const empty = await blank(PAGES.northwind.url);
    const { job, popup } = await fill(PAGES.northwind.url);
    await hideToast(job);
    captures.northwind = { empty, page: await job.screenshot(), popup: await popup.locator('main').screenshot() };
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

  // 3: a German form, filled from the German interface.
  {
    const empty = await blank(PAGES.weber.url);
    const { job, popup } = await fill(PAGES.weber.url, {
      lang: 'de',
      button: 'Diese Seite ausfüllen',
      filled: /\d+ ausgefüllt/,
      notice: 'ausgefüllt',
    });
    await hideToast(job);
    captures.weber = { empty, page: await job.screenshot(), popup: await popup.locator('main').screenshot() };
    await popup.close();
    await job.close();
  }

  // 4 and 5: the profile page, top (personal details) and bottom (saved answers, export and delete).
  {
    await worker.evaluate(() => chrome.storage.local.set({ uiLanguage: 'en' }));
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

// --- Chrome slides -----------------------------------------------------------------------------

// Shared with the promo tile: the extension's two typefaces, embedded because both render offline, the icon and
// the check that marks every promise.
const font = (file) =>
  `data:font/woff2;base64,${readFileSync(join(root, 'node_modules/@fontsource-variable', file)).toString('base64')}`;
const fraunces = font('fraunces/files/fraunces-latin-opsz-normal.woff2');
const instrument = font('instrument-sans/files/instrument-sans-latin-wght-normal.woff2');
const icon = dataUrl(readFileSync(join(root, 'public/icon/128.png')));
const tick =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const pointer =
  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5l12.5 7.6-5.4 1.4 3.2 5.6-2.4 1.4-3.2-5.6L6.5 18z"/></svg>';

// One grid for every slide: content starts at TOP under the headline, between the side margins, job forms are
// drawn at SCALE and the popup sits in one place, so nothing changes size or jumps from slide to slide.
const MARGIN = 64;
const TOP = 250;
const SCALE = 0.88;
const POPUP_SHOWN = 378;

/** A window onto an area [x, y, w, h] of a page capture (pages are 1280 CSS px wide), drawn at `scale`. */
const crop = (png, [x, y, w, h], scale) =>
  `<div class="crop" style="width:${w * scale}px;height:${h * scale}px"><img src="${dataUrl(png)}" style="width:${WIDTH * scale}px;margin:${-y * scale}px 0 0 ${-x * scale}px"></div>`;
const card = (png, area, scale, left, top, style = '') =>
  `<div class="card" style="left:${left}px;top:${top}px;${style}">${crop(png, area, scale)}</div>`;
const shownPopup = (png) =>
  `<div class="popup" style="right:48px;top:${TOP - 14}px"><img src="${dataUrl(png)}" style="width:${POPUP_SHOWN}px"></div>`;
const pill = (text, style, glyph = tick) => `<div class="pill" style="${style}">${glyph}${text}</div>`;
/** A gold ring around the page area [x, y, w, h] of a card placed at (left, top) from crop origin (cx, cy). */
const ring = ([left, top, cx, cy, scale], [x, y, w, h], pad = 8) =>
  `<div class="ring" style="left:${left + (x - cx) * scale - pad}px;top:${top + (y - cy) * scale - pad}px;width:${w * scale + 2 * pad}px;height:${h * scale + 2 * pad}px"></div>`;

const SLIDE_CSS = `
  @font-face { font-family: Fraunces; src: url(${fraunces}) format('woff2'); font-weight: 100 900; }
  @font-face { font-family: 'Instrument Sans'; src: url(${instrument}) format('woff2'); font-weight: 400 700; }
  * { box-sizing: border-box; }
  body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; position: relative;
    font-family: 'Instrument Sans', sans-serif; color: #faf8f3;
    background: radial-gradient(110% 80% at 80% 0%, #2a8a64 0%, #1f6b4f 55%, #185a42 100%); }
  .brand { position: absolute; left: ${MARGIN}px; top: 52px; display: flex; align-items: center; gap: 12px; }
  .brand img { width: 40px; height: 40px; border-radius: 10px; box-shadow: 0 0 0 2px rgba(250,248,243,.5); }
  .brand span { font-family: Fraunces, serif; font-size: 26px; font-weight: 600; }
  h1 { position: absolute; left: ${MARGIN}px; top: 116px; margin: 0; font-family: Fraunces, serif; font-weight: 600;
    font-size: 60px; letter-spacing: -1.6px; line-height: 1; white-space: nowrap; }
  h1 em { font-style: normal; color: #f2c46d; }
  .crop { overflow: hidden; position: relative; }
  .crop img { display: block; }
  .card { position: absolute; border-radius: 16px; overflow: hidden; background: #fff;
    box-shadow: 0 30px 60px rgba(5,25,18,.45), 0 4px 12px rgba(5,25,18,.25); }
  .popup { position: absolute; border-radius: 14px; overflow: hidden; transform: rotate(2deg); z-index: 1;
    box-shadow: 0 30px 70px rgba(5,25,18,.55), 0 0 0 1px rgba(15,23,42,.1); }
  .popup img { display: block; }
  .pill { position: absolute; display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-radius: 999px;
    background: #f2c46d; color: #123f2f; font-size: 21px; font-weight: 700; white-space: nowrap; z-index: 2;
    box-shadow: 0 12px 28px rgba(5,25,18,.4); }
  .pill svg { width: 22px; height: 22px; }
  .ring { position: absolute; border: 4px solid #f2c46d; border-radius: 12px; box-shadow: 0 0 0 6px rgba(242,196,109,.25); }
  .row { position: absolute; left: ${MARGIN}px; display: flex; align-items: center; gap: 10px; }
  .label { font-size: 15px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }
  .chip { padding: 9px 16px; border-radius: 999px; background: rgba(250,248,243,.12);
    box-shadow: inset 0 0 0 1.5px rgba(250,248,243,.35); font-size: 19px; font-weight: 600; }
  .chip.on { background: #f2c46d; color: #123f2f; box-shadow: none; }
  .split { position: absolute; overflow: visible; z-index: 1; }
  .promises { position: absolute; left: ${MARGIN}px; top: ${TOP + 18}px; width: 556px; margin: 0; padding: 0; list-style: none; }
  .promises li { display: flex; gap: 18px; align-items: flex-start; font-size: 26px; font-weight: 600; line-height: 1.25;
    margin-bottom: 34px; }
  .promises i { flex: none; width: 38px; height: 38px; border-radius: 50%; background: #f2c46d; color: #174f3b;
    display: grid; place-items: center; }
  .promises i svg { width: 22px; height: 22px; }
`;
const slide = (
  title,
  body,
) => `<!doctype html><html><head><meta charset="utf-8"><style>${SLIDE_CSS}</style></head><body>
  <div class="brand"><img src="${icon}"><span>LocalApply</span></div><h1>${title}</h1>${body}</body></html>`;

// The job forms from just above the first label, both columns and no page header, cut off between two rows.
const FORM_X = 168;
const FORM_W = 944;
const FORM_Y = 176;
// The gutter between the form's two columns, in page coordinates: the split runs inside it, so no field is cut.
const GUTTER = [634, 648];

/** The form empty on the left and filled on the right, split by a gold line leaning across the gutter. */
function split({ empty, page }, bottom) {
  const area = [FORM_X, FORM_Y, FORM_W, bottom - FORM_Y];
  const w = FORM_W * SCALE;
  const h = area[3] * SCALE;
  const [top, foot] = [(GUTTER[1] - FORM_X) * SCALE, (GUTTER[0] - FORM_X) * SCALE];
  return {
    bottom: TOP + h,
    line: MARGIN + (top + foot) / 2,
    html: `${card(empty, area, SCALE, MARGIN, TOP)}
      ${card(page, area, SCALE, MARGIN, TOP, `clip-path:polygon(${top}px 0, ${w}px 0, ${w}px ${h}px, ${foot}px ${h}px);box-shadow:none`)}
      <svg class="split" style="left:${MARGIN}px;top:${TOP}px" width="${w}" height="${h}"><path d="M${top} 0 L${foot} ${h}" stroke="#f2c46d" stroke-width="4"/></svg>`,
  };
}

const SLIDES = {};

// 1: one click turns the empty form into a filled one; the popup reports it.
{
  const { bottom, line, html } = split(captures.northwind, 604);
  SLIDES['1-fill-in-one-click'] = slide(
    'Fill job applications in <em>one click</em>',
    `${html}
    <div class="row" style="top:${bottom + 24}px"><span class="label" style="color:#cfe3d8">Before</span></div>
    <div class="row" style="top:${bottom + 24}px;left:${line + 104}px"><span class="label" style="color:#f2c46d">After</span></div>
    ${pill('One click', `left:${line - 84}px;top:${bottom + 12}px`, pointer)}
    ${shownPopup(captures.northwind.popup)}`,
  );
}

// 2: the listing's promises, each backed by the part of the profile page that keeps it.
{
  const left = 640;
  const width = WIDTH - MARGIN - left;
  const head = [304, 24, 664, 190];
  const backup = [330, 490, 620, 196];
  const [hs, bs] = [width / head[2], width / backup[2]];
  const backupTop = TOP + 398 - backup[3] * bs;
  const promise = (text) => `<li><i>${tick}</i><span>${text}</span></li>`;
  SLIDES['2-free-and-private'] = slide(
    '<em>Free.</em> No account. No subscription.',
    `<ul class="promises">
      ${promise('Your profile and CV stay in your browser')}
      ${promise('No server, no AI service, no analytics')}
      ${promise('Never presses Submit for you')}
      ${promise('Export or delete everything in one click')}
    </ul>
    ${card(captures.profile.page, head, hs, left, TOP, 'background:#f3f0e8')}
    ${ring([left, TOP, head[0], head[1], hs], [326, 98, 344, 46])}
    ${card(captures.profileData.page, backup, bs, left, backupTop, 'background:#fffdf8')}
    ${ring([left, backupTop, backup[0], backup[1], bs], [366, 608, 352, 38])}`,
  );
}

// 3: a saved answer fills "Why do you want to join?"; the popup offers to save the question still open.
{
  const answer = [186, 446, 909, 78];
  const ringTop = TOP + (answer[1] - FORM_Y) * SCALE - 4;
  SLIDES['3-saved-answers'] = slide(
    'Answer once. <em>Filled next time.</em>',
    `${card(captures.brightwave.page, [FORM_X, FORM_Y, FORM_W, 626 - FORM_Y], SCALE, MARGIN, TOP)}
    ${ring([MARGIN, TOP, FORM_X, FORM_Y, SCALE], answer, 4)}
    ${pill('Saved answer', `left:600px;top:${ringTop - 58}px`)}
    ${shownPopup(captures.brightwave.popup)}`,
  );
}

// 4: a German form filled from the German interface, and the languages form labels are read in.
{
  const { bottom, html } = split(captures.weber, 600);
  const LANGUAGES = ['English', 'Deutsch', 'Français', 'Español', 'Italiano', 'Nederlands', 'Português', 'Polski'];
  SLIDES['4-eight-languages'] = slide(
    'Reads forms in <em>8 languages</em>',
    `${html}
    <div class="row" style="top:${bottom + 18}px">${LANGUAGES.map((l) => `<span class="chip${l === 'Deutsch' ? ' on' : ''}">${l}</span>`).join('')}</div>
    ${shownPopup(captures.weber.popup)}`,
  );
}

// 5: the whole profile page beside the log of where you applied.
{
  const profile = [16, 16, 960, 584];
  const ps = 398 / profile[3];
  const logLeft = MARGIN + profile[2] * ps + 24;
  const log = [340, 40, 600, 428];
  SLIDES['5-one-profile'] = slide(
    'Your profile, <em>every application</em>',
    `${card(captures.profile.page, profile, ps, MARGIN, TOP, 'background:#f3f0e8')}
    ${card(captures.profileData.page, log, (WIDTH - MARGIN - logLeft) / log[2], logLeft, TOP, 'background:#fffdf8')}
    ${pill('See where you applied', `right:${MARGIN + 24}px;top:${TOP - 26}px`)}`,
  );
}

const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  // Old screenshots may have other names; start from an empty folder.
  for (const dir of [outDir, slidesDir]) {
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.png'))) rmSync(join(dir, name));
  }
  const shot = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const render = async (html, path) => {
    await shot.setContent(html);
    await shot.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode())]));
    writeFileSync(path, await shot.screenshot());
  };
  for (const [name, spec] of Object.entries(SHOTS)) await render(frame(spec), join(outDir, `${name}.png`));
  for (const [name, html] of Object.entries(SLIDES)) await render(html, join(slidesDir, `${name}.png`));

  // Chrome Web Store small promo tile: shown in search results and category pages. Chrome allows text here.
  const tile = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
  // The Forest accent, its dark-mode mint and the paper, with gold for the ticks. It sits on a light grey card in
  // search results at about half size, so the tile is green edge to edge, text stays large and the copy stays short.
  const field = (value) => `<div class="bar"></div><div class="field">${value}<i>${tick}</i></div>`;
  const perk = (text) => `<li><i>${tick}</i>${text}</li>`;
  await tile.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Fraunces; src: url(${fraunces}) format('woff2'); font-weight: 100 900; }
    @font-face { font-family: 'Instrument Sans'; src: url(${instrument}) format('woff2'); font-weight: 400 700; }
    * { box-sizing: border-box; }
    body { margin: 0; width: 440px; height: 280px; overflow: hidden; position: relative;
      font-family: 'Instrument Sans', sans-serif; color: #faf8f3; background: #1f6b4f; }
    .copy { position: absolute; left: 26px; top: 26px; width: 210px; }
    .brand { display: flex; align-items: center; gap: 8px; }
    .brand img { width: 28px; height: 28px; border-radius: 7px; box-shadow: 0 0 0 1.5px rgba(250,248,243,.5); }
    .brand span { font-family: Fraunces, serif; font-size: 18px; font-weight: 600; }
    h1 { margin: 16px 0 0; font-family: Fraunces, serif; font-size: 30px; line-height: 1.02; font-weight: 600;
      letter-spacing: -.8px; }
    /* The listing leads with these three; the tile is what search results show, so it says them too. */
    ul { list-style: none; margin: 16px 0 0; padding: 0; }
    li { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
    li i { width: 20px; height: 20px; border-radius: 50%; background: #f2c46d; color: #174f3b; display: grid; place-items: center; }
    li i svg { width: 12px; height: 12px; }
    /* A form that has just been filled, on a mint panel: the product in one glance. */
    .panel { position: absolute; right: 0; top: 0; bottom: 0; width: 170px; background: linear-gradient(165deg, #74c79f, #3f9b73); }
    .card { position: absolute; left: 246px; top: 50px; width: 180px; padding: 12px; border-radius: 12px; background: #fffdf8;
      color: #1c1a16; transform: rotate(-3deg); box-shadow: 0 16px 36px rgba(5,25,18,.4); }
    .bar { height: 5px; width: 50px; border-radius: 3px; background: #ded8ca; margin-bottom: 4px; }
    .field { display: flex; align-items: center; justify-content: space-between; height: 24px; padding: 0 7px;
      border: 1.5px solid #1f6b4f; border-radius: 7px; background: #eef5f0; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
    .field:last-child { margin: 0; }
    .field i { width: 14px; height: 14px; border-radius: 50%; background: #1f6b4f; color: #fff; display: grid; place-items: center; }
    .field i svg { width: 9px; height: 9px; }
  </style></head><body>
    <div class="panel"></div>
    <div class="copy">
      <div class="brand"><img src="${icon}"><span>LocalApply</span></div>
      <h1>Fill job applications in one click</h1>
      <ul>${perk('Free')}${perk('No account')}${perk('No subscription')}</ul>
    </div>
    <div class="card">${field('Alex Morgan')}${field('+49 151 23456789')}${field('Berlin')}${field('Alex_Morgan_CV.pdf')}</div>
  </body></html>`);
  await tile.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode())]));
  writeFileSync(join(chromeDir, 'promo-tile-440x280.png'), await tile.screenshot());
} finally {
  await browser.close();
}
console.log(
  `Wrote ${Object.keys(SHOTS).length} Firefox screenshots to store/screenshots/, ${Object.keys(SLIDES).length} Chrome ` +
    'slides to store/chrome/screenshots/ and the promo tile to store/chrome/',
);
