# Notes to reviewer (Firefox)

Paste into "Notes to reviewer" when uploading a version. Replace `<version>` with the version number.

```
Source code is attached (localapply-<version>-sources.zip). To reproduce the submitted package:

  Node.js 22 or newer (built with Node 24.16.0, npm 11.13.0)
  npm ci
  npm run build:firefox

The output in .output/firefox-mv2/ is identical to the uploaded file. Tooling: WXT 0.21 (Vite) with React 19 and Tailwind CSS 4.

The add-on makes no network requests and loads no remote code. It stores the user's profile in storage.local (unlimitedStorage because the user's CV file is stored as a data URL).

The content script runs on <all_urls> in all frames because job application forms are hosted on arbitrary employer domains and are often embedded in iframes from applicant-tracking systems. It reads and writes form fields only when the user triggers a fill (toolbar popup or Alt+Shift+F). It never submits forms.

To test: open the add-on's preferences, enter a first name and email, then open tests/fixtures/generic-en.html from the source zip (or any job application page), click the toolbar button and choose "Fill this page".
```

Before uploading, confirm the sources zip still rebuilds to the same files; `docs/releasing.md` has the check.
