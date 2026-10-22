# LocalApply

**[Get LocalApply for Firefox](https://addons.mozilla.org/en-US/firefox/addon/localapply-job-autofill/)**

Private job application autofill for Firefox and Chromium browsers. You save your details once; on any application form, one click fills name, contact details, address, links, salary expectation, availability, education, CV and your saved answers. You review the form and submit it yourself.

Everything stays in the browser: no account, no server, no AI service, no network requests.

![LocalApply filling a job application from the toolbar popup](store/screenshots/1-fill-in-one-click.png)

## What it does

- **Fills the repetitive part:** name, email, phone (including country-code pickers), address, date of birth, LinkedIn, GitHub, Xing and portfolio links, salary expectation, notice period, start date, years of experience, work authorisation, visa sponsorship and relocation questions, current job, highest education level and degree, CV and cover letter.
- **Works in eight languages:** recognises form labels in English, German, French, Spanish, Italian, Dutch, Portuguese and Polish, and the interface itself speaks all eight.
- **Answers each question once:** save your reply to a recurring question like "How did you hear about us?" and it is filled in next time.
- **Shows what it did:** filled fields get a solid green outline, open required questions a dashed amber one. **Undo** puts everything back.
- **Never submits:** it doesn't press Submit or Next, doesn't tick consent boxes, and leaves fields you already filled alone.
- **Looks the way you like:** five colour palettes (Forest, Ocean, Plum, Clay, Graphite), each with a dark version.

It works on ordinary company career pages and on Greenhouse, Ashby, Personio, Recruitee and Teamtailor, with site-specific handling for Workday, Lever, SmartRecruiters, SAP SuccessFactors and LinkedIn Easy Apply.

| Saved answers                                                      | Any language                                                                            | Your profile                                         |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| ![A saved answer filled in](store/screenshots/2-saved-answers.png) | ![A German form filled from the German interface](store/screenshots/3-any-language.png) | ![The profile page](store/screenshots/4-profile.png) |

## Use it

1. Enter your details once on the profile page: click the LocalApply toolbar button, then **Edit profile**.
2. Open a job application, click the LocalApply toolbar button and then **Fill this page**, or press **Alt+Shift+F**.
3. Check the result, finish the outlined questions, and submit the form yourself.

Your profile can be exported to a file and imported again, or deleted with one click.

## Install a release

The latest version is **[v0.5.0](releases/v0.5.0/)** ([release notes](releases/v0.5.0/RELEASE_NOTES.md)). Every version is in [`releases/`](releases/), one folder per version with the packages, release notes and checksums.

- **Chrome, Edge, Brave:** unzip `localapply-<version>-chrome.zip`, open `chrome://extensions`, turn on Developer mode, choose "Load unpacked" and pick the unzipped folder.
- **Firefox:** open `about:debugging#/runtime/this-firefox`, choose "Load Temporary Add-on" and pick `localapply-<version>-firefox.zip` (removed when Firefox restarts). For a permanent install, use the signed version from [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/localapply-job-autofill/), or Firefox Developer Edition with `xpinstall.signatures.required` set to `false`.

## Develop

Node.js 22 or newer.

```bash
npm install
npm run dev            # Chrome with hot reload (npm run dev:firefox for Firefox)
npm run check          # typecheck, lint, format check, unit tests, Mozilla's add-on linter
npm run test:e2e       # loads the built extension in Chromium (first time: npx playwright install chromium)
```

| Command                 | What it does                                                            |
| ----------------------- | ----------------------------------------------------------------------- |
| `npm run build`         | Builds the Chrome extension into `.output/chrome-mv3`                   |
| `npm run build:firefox` | Builds the Firefox add-on into `.output/firefox-mv2`                    |
| `npm run package`       | Zips both builds plus the source bundle into `.output/`                 |
| `npm test`              | Unit tests (jsdom)                                                      |
| `npm run lint`          | ESLint                                                                  |
| `npm run format`        | Prettier                                                                |
| `npm run icons`         | Redraws the extension and store icons                                   |
| `npm run store-assets`  | Renders store screenshots and the Chrome promo tile                     |
| `npm run release`       | Checks, builds and writes `releases/v<version>/`, then commits and tags |

## Project layout

```
entrypoints/        extension entry points: background, content script, popup, profile (options) page
src/
  core/             messages passed between popup, background and pages
  engine/           finds form fields, matches them to profile data and fills them
    rules/          field definitions and label phrases, one file per language in rules/locales/
  adapters/         per-site knowledge, one file per applicant-tracking system
  profile/          profile data model, storage and version migrations
  ui/               shared styles and React components
tests/
  unit/             engine and profile tests (Vitest + jsdom)
  e2e/              end-to-end test of the built extension (Playwright)
  fixtures/         sample application forms
scripts/            icons, store images, release
store/              store listings, screenshots and promo images for Firefox and Chrome
releases/           shipped versions, one folder each
docs/               architecture, extending, releasing
```

## Docs

- [Architecture](docs/architecture.md): how a fill works and where each piece lives
- [Extending](docs/extending.md): adding a profile field, a language, a job site, a profile migration
- [Releasing](docs/releasing.md): versioning, changelog, building a release, uploading to the stores
- [Store listings](store/README.md): what goes into each store form
- [Privacy policy](PRIVACY.md)
- [Changelog](CHANGELOG.md)
