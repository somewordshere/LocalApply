// Renders the store screenshots (1280x800) from the real built extension.
// Demo job pages are fictional and served through request interception; the profile is made up.
// Run with `npm run store-assets` (builds first).
// Output: store/screenshots/*.png (both stores) and store/chrome/promo-tile-440x280.png (Chrome Web Store).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const extension = join(root, '.output/chrome-mv3');
const outDir = join(root, 'store/screenshots');
const chromeDir = join(root, 'store/chrome');
mkdirSync(outDir, { recursive: true });
mkdirSync(chromeDir, { recursive: true });

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
      answer: 'Your platform team works on exactly the testing problems I enjoy most.',
    },
  ],
  gender: '',
  disability: '',
  veteran: '',
};

const FORM_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.45 "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #f1f5f9; }
  .top { background: #0f766e; color: #fff; padding: 14px 32px; font-weight: 600; letter-spacing: .2px; }
  .top small { font-weight: 400; opacity: .8; margin-left: 10px; }
  main { max-width: 1000px; margin: 22px auto; background: #fff; border-radius: 14px; padding: 26px 32px; box-shadow: 0 1px 3px rgba(15,23,42,.08); }
  h1 { font-size: 22px; margin: 0 0 2px; }
  .sub { color: #64748b; margin: 0 0 18px; }
  form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 22px; }
  label, legend { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
  input:not([type=radio]):not([type=file]), textarea, select { width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; }
  textarea { height: 64px; resize: none; }
  .wide { grid-column: 1 / -1; }
  fieldset { border: 0; margin: 0; padding: 0; }
  .choices { display: flex; gap: 18px; font-weight: 400; }
  .choices label { font-weight: 400; display: flex; gap: 6px; align-items: center; margin: 0; }
  .drop { border: 1.5px dashed #94a3b8; border-radius: 8px; padding: 9px 12px; color: #475569; display: flex; align-items: center; gap: 10px; }
  .drop input { display: none; }
  .drop b { color: #0f766e; }
  .req { color: #dc2626; }
`;

const ENGLISH_JOB = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Senior QA Engineer · Northwind Labs</title><style>${FORM_CSS}</style></head><body>
<div class="top">Northwind Labs <small>Careers</small></div>
<main>
  <h1>Senior QA Engineer</h1>
  <p class="sub">Berlin · Hybrid · Full-time</p>
  <form>
    <div><label for="fn">First name <span class="req">*</span></label><input id="fn" required></div>
    <div><label for="ln">Last name <span class="req">*</span></label><input id="ln" required></div>
    <div><label for="em">Email <span class="req">*</span></label><input id="em" type="email" required></div>
    <div><label for="ph">Phone <span class="req">*</span></label><input id="ph" type="tel" required></div>
    <div><label for="li">LinkedIn profile</label><input id="li"></div>
    <div><label for="gh">GitHub</label><input id="gh"></div>
    <div><label for="sal">Salary expectation (yearly, gross) <span class="req">*</span></label><input id="sal" required></div>
    <div><label for="np">Notice period</label><input id="np"></div>
    <fieldset><legend>Are you authorized to work in Germany? <span class="req">*</span></legend>
      <div class="choices"><label><input type="radio" name="auth" value="y"> Yes</label><label><input type="radio" name="auth" value="n"> No</label></div></fieldset>
    <fieldset><legend>Will you require visa sponsorship? <span class="req">*</span></legend>
      <div class="choices"><label><input type="radio" name="visa" value="y"> Yes</label><label><input type="radio" name="visa" value="n"> No</label></div></fieldset>
    <div><label for="cv">Resume / CV <span class="req">*</span></label>
      <div class="drop"><input id="cv" type="file" required><span id="cvname">Drop your file here or <b>browse</b></span></div></div>
    <div><label for="hear">How did you hear about us? <span class="req">*</span></label><input id="hear" required></div>
    <div class="wide"><label for="cl">Cover letter</label><textarea id="cl"></textarea></div>
  </form>
</main>
<script>document.getElementById('cv').addEventListener('change', (e) => { document.getElementById('cvname').textContent = '📄 ' + e.target.files[0].name; });</script>
</body></html>`;

const GERMAN_JOB = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Softwaretester (m/w/d) · Weber Sensorik</title><style>${FORM_CSS} .top { background: #1d4ed8; }</style></head><body>
<div class="top">Weber Sensorik GmbH <small>Karriere</small></div>
<main>
  <h1>Softwaretester (m/w/d)</h1>
  <p class="sub">Stuttgart · Vollzeit · ab sofort</p>
  <form>
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
    <div><label for="ein">Frühester Eintrittstermin</label><input id="ein" placeholder="TT.MM.JJJJ"></div>
    <div><label for="kf">Kündigungsfrist</label><input id="kf"></div>
    <div><label for="ll">Lebenslauf <span class="req">*</span></label>
      <div class="drop"><input id="ll" type="file" required><span id="llname">Datei hierher ziehen oder <b>auswählen</b></span></div></div>
  </form>
</main>
<script>document.getElementById('ll').addEventListener('change', (e) => { document.getElementById('llname').textContent = '📄 ' + e.target.files[0].name; });</script>
</body></html>`;

const userData = mkdtempSync(join(tmpdir(), 'localapply-shots-'));
const context = await chromium.launchPersistentContext(userData, {
  channel: 'chromium',
  headless: true,
  deviceScaleFactor: 2,
  viewport: { width: 1100, height: 780 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});

const shots = {};
try {
  const html = (body) => (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body });
  await context.route('https://careers.northwind.example/**', html(ENGLISH_JOB));
  await context.route('https://karriere.weber-sensorik.example/**', html(GERMAN_JOB));

  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  await worker.evaluate((profile) => chrome.storage.local.set({ profile }), PROFILE);

  const fillWithPopup = async (url) => {
    const job = await context.newPage();
    await job.goto(url);
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 360, height: 640 });
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await job.bringToFront();
    await popup.getByRole('button', { name: 'Fill this page' }).click();
    await popup.getByText(/\d+ filled/).waitFor();
    await job.getByRole('status').filter({ hasText: 'Filled' }).waitFor();
    await job.mouse.move(0, 0);
    return { job, popup };
  };

  // 1 + 3: English application, then the popup's follow-up for the open question.
  {
    const { job, popup } = await fillWithPopup('https://careers.northwind.example/jobs/senior-qa/apply');
    shots.form = await job.screenshot();
    shots.popup = await popup.locator('main').screenshot();
    await popup.getByRole('button', { name: 'Save answer' }).first().click();
    await popup.getByPlaceholder('Your answer').fill('LinkedIn');
    shots.popupAnswer = await popup.locator('main').screenshot();
    await popup.close();
    await job.close();
  }

  // 2: profile page.
  {
    const options = await context.newPage();
    await options.setViewportSize({ width: 760, height: 860 });
    await options.goto(`chrome-extension://${id}/options.html`);
    await options.getByText('All changes saved').waitFor();
    shots.profile = await options.screenshot();
    await options.locator('#job').scrollIntoViewIfNeeded();
    await options.evaluate(() => window.scrollTo(0, document.getElementById('job').offsetTop - 24));
    shots.profileJob = await options.screenshot();
    await options.evaluate(() => window.scrollTo(0, document.getElementById('documents').offsetTop - 24));
    shots.profileData = await options.screenshot();
    await options.close();
  }

  // 4: German form.
  {
    const { job, popup } = await fillWithPopup('https://karriere.weber-sensorik.example/stellen/softwaretester');
    shots.german = await job.screenshot();
    await popup.close();
    await job.close();
  }
} finally {
  await context.close();
  rmSync(userData, { recursive: true, force: true });
}

const img = (name) => `data:image/png;base64,${shots[name].toString('base64')}`;

const SLIDE_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; width: 1280px; height: 800px; overflow: hidden; font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a;
    background: radial-gradient(circle at 85% 10%, #e0e7ff 0, transparent 45%), linear-gradient(160deg, #f8fafc 0%, #eef2ff 100%); }
  .head { position: absolute; left: 64px; top: 52px; width: 1150px; }
  .brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; color: #4338ca; font-size: 15px; letter-spacing: .3px; }
  .brand i { width: 20px; height: 20px; border-radius: 5px; background: #4f46e5; display: inline-block; position: relative; }
  .brand i::after { content: ""; position: absolute; left: 6px; top: 3px; width: 5px; height: 10px; border: solid #fff; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
  h1 { font-size: 40px; line-height: 1.15; margin: 10px 0 8px; letter-spacing: -.5px; }
  p.lead { font-size: 19px; color: #475569; margin: 0; }
  .window { position: absolute; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 24px 60px -12px rgba(30,41,59,.35), 0 0 0 1px rgba(15,23,42,.08); }
  .bar { height: 34px; background: #e2e8f0; display: flex; align-items: center; gap: 7px; padding: 0 12px; }
  .bar span { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
  .bar div { margin-left: 10px; flex: 1; height: 22px; border-radius: 6px; background: #fff; font-size: 12px; color: #475569; display: flex; align-items: center; padding: 0 10px; }
  .window img { display: block; width: 100%; }
  .popup { position: absolute; border-radius: 12px; overflow: hidden; box-shadow: 0 30px 70px -10px rgba(30,41,59,.45), 0 0 0 1px rgba(15,23,42,.1); background: #fff; }
  .popup img { display: block; width: 100%; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .chips span { background: #fff; border: 1px solid #c7d2fe; color: #3730a3; border-radius: 999px; padding: 5px 12px; font-size: 14px; font-weight: 600; }
  ul.points { list-style: none; padding: 0; margin: 26px 0 0; display: grid; gap: 16px; }
  ul.points li { font-size: 18px; color: #334155; padding-left: 34px; position: relative; }
  ul.points li::before { content: ""; position: absolute; left: 0; top: 2px; width: 22px; height: 22px; border-radius: 6px; background: #dcfce7; }
  ul.points li::after { content: ""; position: absolute; left: 8px; top: 6px; width: 5px; height: 10px; border: solid #16a34a; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
`;

const browserWindow = (src, url, style) =>
  `<div class="window" style="${style}"><div class="bar"><span></span><span></span><span></span><div>🔒 ${url}</div></div><img src="${src}"></div>`;

const head = (title, lead, extra = '') =>
  `<div class="head"><div class="brand"><i></i>LocalApply</div><h1>${title}</h1><p class="lead">${lead}</p>${extra}</div>`;

const SLIDES = {
  '1-fill-in-one-click': `
    ${head('Fill job applications in one click', 'Your details, links, salary expectation and CV go in. You review and press submit.')}
    ${browserWindow(img('form'), 'careers.northwind.example/jobs/senior-qa/apply', 'left:64px; top:190px; width:800px;')}
    <div class="popup" style="left:896px; top:190px; width:320px;"><img src="${img('popup')}"></div>`,
  '2-profile': `
    ${head('Save your profile once', 'Personal details, address, links, salary, availability, documents and your own answers.')}
    ${browserWindow(img('profile'), 'LocalApply · Your profile', 'left:64px; top:200px; width:540px;')}
    ${browserWindow(img('profileJob'), 'LocalApply · Your profile', 'left:676px; top:200px; width:540px;')}`,
  '3-whats-left': `
    ${head('See what is done and what is left', 'Green means filled, amber means it needs you. Save an answer once and it is reused next time.')}
    ${browserWindow(img('form'), 'careers.northwind.example/jobs/senior-qa/apply', 'left:64px; top:205px; width:700px; opacity:.97;')}
    <div class="popup" style="left:800px; top:205px; width:416px;"><img src="${img('popupAnswer')}"></div>`,
  '4-languages': `
    ${head(
      'Understands forms in 8 languages',
      'Vorname, Prénom, Nombre, Imię: labels are recognised whatever language the job is posted in.',
      '<div class="chips"><span>English</span><span>Deutsch</span><span>Français</span><span>Español</span><span>Italiano</span><span>Nederlands</span><span>Português</span><span>Polski</span></div>',
    )}
    ${browserWindow(img('german'), 'karriere.weber-sensorik.example/stellen/softwaretester', 'left:64px; top:262px; width:1152px; height:520px;')}`,
  '5-private': `
    <div class="head" style="width:540px; top:170px;"><div class="brand"><i></i>LocalApply</div>
      <h1>Private by design</h1>
      <p class="lead">No account, no server, no AI service. Your profile stays in your browser.</p>
      <ul class="points">
        <li>Nothing is uploaded or tracked</li>
        <li>Never presses Submit or ticks consent boxes</li>
        <li>Skips fields you already filled in</li>
        <li>Export and delete your data any time</li>
      </ul></div>
    ${browserWindow(img('profileData'), 'LocalApply · Your profile', 'left:676px; top:60px; width:540px;')}`,
};

const browser = await chromium.launch({ channel: 'chromium', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  for (const [name, body] of Object.entries(SLIDES)) {
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${SLIDE_CSS}</style></head><body>${body}</body></html>`,
    );
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    writeFileSync(join(outDir, `${name}.png`), await page.screenshot());
  }

  // Chrome Web Store small promo tile: shown in search results and category pages.
  const icon = `data:image/png;base64,${readFileSync(join(root, 'public/icon/128.png')).toString('base64')}`;
  const tile = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
  await tile.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; width: 440px; height: 280px; overflow: hidden; font-family: "Segoe UI", system-ui, sans-serif; color: #fff;
      background: radial-gradient(circle at 90% 0%, #818cf8 0, transparent 55%), linear-gradient(150deg, #4f46e5 0%, #312e81 100%);
      display: flex; flex-direction: column; justify-content: center; padding: 0 36px; box-sizing: border-box; }
    .row { display: flex; align-items: center; gap: 14px; }
    img { width: 56px; height: 56px; filter: drop-shadow(0 6px 14px rgba(15,23,42,.35)); }
    h1 { margin: 0; font-size: 34px; letter-spacing: -.5px; }
    p { margin: 18px 0 0; font-size: 21px; line-height: 1.3; font-weight: 600; }
    small { display: block; margin-top: 10px; font-size: 14px; opacity: .85; }
  </style></head><body>
    <div class="row"><img src="${icon}"><h1>LocalApply</h1></div>
    <p>Fill job applications<br>in one click</p>
    <small>Private: your data stays in your browser</small>
  </body></html>`);
  await tile.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  writeFileSync(join(chromeDir, 'promo-tile-440x280.png'), await tile.screenshot());
} finally {
  await browser.close();
}
console.log(
  `Wrote ${Object.keys(SLIDES).length} screenshots to store/screenshots/ and the promo tile to store/chrome/`,
);
