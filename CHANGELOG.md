# Changelog

All notable changes to LocalApply. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

Add entries under **Unreleased** as you work. `npm run release` requires a section for the version in `package.json` and copies it into the release folder as the release notes.

## [Unreleased]

### Added

- Multi-step applications are filled step by step: after a fill, the following steps of the same application on the same site are filled as they appear, whether the site swaps the form in place (Workday, SuccessFactors) or loads a new page. Turn it off in the popup ("Keep filling the next steps"). It still never presses Next or Submit, and later steps don't add entries to the application log.
- The application log is a small tracker: each application has a status (applied, interview, offer, rejected) and notes, and keeps the job description when the posting includes one, since postings disappear. The CSV export has Status and Notes columns, and the popup's "applied before" note shows the status.
- "Add another" help: when the profile has more jobs or schools than the form has blocks, and the form has an add button, the popup offers to press it and fill the new blocks.
- "Why wasn't something filled?" in the popup lists every field with what it was taken for and what happened, and can save a copy of the form for a bug report: its layout, labels, names and ids, without values, scripts, images or links.
- Saved answers are learned from dropdowns and radio buttons too, and "Save what's in this field as an answer" in the right-click menu saves one without a fill first.
- The saved-answers list has a search box, multi-line answer boxes, and shows how often and when each answer was last used.
- A practice form on the welcome page, filled from the profile, to see a fill before trying a real application.
- Workable, iCIMS, Taleo, softgarden, d.vinci, rexx, Umantis and JOIN are recognised. Taleo and Workable fields are picked by their names; built from their markup, not yet tried on live postings.

### Fixed

- On a form where an earlier job or school block was already filled, the next empty block got the first entry again instead of the next one.
- LocalApply's own notice and answer card are no longer scanned as form fields.

## [0.9.1] - 2026-10-28

### Fixed

- Dropdowns draw their own arrow, in the theme's colours, instead of the system one; the open list follows the theme where the browser allows.
- The phone boxes line up with the two columns of the profile form: code and number on the left, the full number on the right.
- The welcome page title is the size of the profile page's, which keeps the display font crisp on Windows in dark mode.

## [0.9.0] - 2026-10-28

### Added

- Learns your answers: after a fill, an answer you type into a question LocalApply couldn't answer is offered for saving in a small card on the page. Review it, edit or untick it, and Save; next time the question is filled for you. The employer and job title in the answer become {company} and {position}. A changed answer to a saved question replaces the old one. Nothing is kept unless you press Save, and password, payment and identity questions are never offered.
- "Fill this field with" in the right-click menu of any form field: your filled-in profile details (with a preview) and saved answers, for the boxes automatic filling missed. Needs the `contextMenus` permission, which shows no install warning.
- The popup says when the application log holds an earlier application to the same employer ("You applied to Acme before", with dates and job titles), comparing company names without their legal form. Filling the same page again on the same day doesn't count.
- A welcome page opens on install: how LocalApply works in three steps, the current keyboard shortcut, what else it does, and how your data stays in the browser. It leads to the profile page, which links back to it under "How LocalApply works".

### Changed

- The privacy policy, the Chrome Web Store permission justifications and the Firefox reviewer notes describe answer learning and the right-click menu.

## [0.8.2] - 2026-10-26

### Changed

- New icon: a filled-in form (three bars, long to short, and a check) in place of the lone check, for every colour palette, the toolbar, the popup, the profile page and the store. The bars sit on whole pixels, so the icon stays sharp at 16 px.

## [0.8.1] - 2026-10-22

### Changed

- The name and summary shown in the browser and both stores now lead with what LocalApply doesn't ask for: free, no account, no subscription, works offline. Firefox gets its own, shorter name, as addons.mozilla.org allows 50 characters.

## [0.8.0] - 2026-10-22

### Added

- Work history and education as lists, most recent first, each with dates (and location and what you did for jobs). A form with several job or school blocks gets one entry per block, in order. Dates are written the way each box wants them: month inputs, MM/YYYY, a month or year on its own, or a month name. Workday's experience and education blocks have site-specific handling (built from Workday's markup, not yet tried on a live posting).
- Several profiles, for example one per language or kind of job: create (empty or as a copy), rename and delete them on the profile page, and choose one in the popup before filling. The application log notes which profile filled each form.

### Changed

- The Background section is replaced by Work experience and Education cards; the highest education level moves into Education. Profiles saved by earlier versions are upgraded: the current job and school become the first entries.
- "Delete all data" removes every profile.

## [0.7.0] - 2026-10-22

### Added

- Spoken languages with a level (A1 to C2, or native). A "Languages" box gets the list; a question about one language ("Deutschkenntnisse", "proficiency in English", "Niveau d'allemand") gets that language's level in the form's own wording.
- Driving licence (yes/no and classes), willingness to travel, and minimum and maximum salary, each recognised in all eight languages. The salary range falls back to the expected salary.
- `{company}` and `{position}` in the cover letter and saved answers are replaced with the employer and job title read from the posting, also when the form is in an embedded frame. A text the page can't complete is left open rather than filled with a gap.
- Application log: each filled form is noted with date, company, job title and link, in the browser only. On by default; turn it off, remove entries, clear it or export it as CSV in the new Applications section. "Delete all data" clears it too.

### Changed

- Optional fields (salary range, licence classes) don't count against how complete the profile is.
- The privacy policy and the Chrome Web Store data disclosures describe the application log.

## [0.6.2] - 2026-10-22

### Added

- Installing LocalApply opens the profile page, with a short note on where to start while the profile is still empty.
- The toolbar button and the logo on the profile page and popup take the colour of the chosen palette.
- The extension's name and summary, and the store listings for both stores, in all eight languages.
- MIT license, and a GitHub workflow that runs every check and the end-to-end test on each push.

## [0.6.1] - 2026-10-22

### Added

- Theme switch on the profile page: System, Light or Dark. System follows your computer's setting as before; Light and Dark override it. The popup follows the choice, and so do dropdowns and date pickers.

## [0.6.0] - 2026-10-22

### Added

- Sexual orientation in the voluntary disclosures. Like the other disclosures it stays blank unless you set it, and is only used when a form asks; LocalApply picks the matching option in any of its eight languages.

### Changed

- The phone number has three linked boxes: country code, number and full number. Typing the full number fills the other two, and typing either part updates the full number. The switch between one box and two is gone.
- On wide screens the profile sheet sits in the middle of the window, with the section index to its left.

## [0.5.0] - 2026-10-22

### Added

- Highest education level (high school to PhD) on the profile page. LocalApply picks it from the radio buttons or dropdown a form offers, in any of its eight languages, and uses it for "Degree" dropdowns that list levels such as Bachelor and Master.
- Five colour palettes (Forest, Ocean, Plum, Clay and Graphite), each with a dark version. Pick one with the swatches at the top of the profile page; the popup and the on-page notice follow it.

## [0.4.1] - 2026-10-21

### Security

- The interface can no longer write raw HTML into a page: the part of React that could (dangerouslySetInnerHTML, never used by LocalApply) is removed at build time. Mozilla's validator no longer warns about unsafe innerHTML assignments.

## [0.4.0] - 2026-10-20

### Added

- The extension speaks your language: the profile page, popup and on-page notice are translated into English, German, French, Spanish, Italian, Dutch, Portuguese and Polish. It starts in your browser's language; switch it with the language menu at the top of the profile page.

### Changed

- New look: a warm paper-and-ink palette with one green accent, in light and dark mode, and bundled typefaces (Fraunces for headings, Instrument Sans for text). The icon is green to match.
- The profile page reads like one document with numbered sections. An index beside it shows how much of each section is filled in and highlights the section you are reading; voluntary disclosures are marked optional and never count towards the total.
- The phone choice (country code + number, or full number) is one clear two-part control.
- After each change is saved, "All changes saved" turns green with a check mark for a moment, then fades back.

## [0.3.0] - 2026-10-16

### Added

- The profile page takes the phone number either as country code and number in two boxes, or as one full number such as +442079460123. A full number is split into code and number, so forms that ask either way are still filled.

### Changed

- Dates go into forms as DD-MM-YYYY when neither the field nor the page shows which order it expects (was YYYY-MM-DD). Native date pickers still get the ISO date they require.

## [0.2.1] - 2026-10-16

### Changed

- Firefox: the add-on ID is now `job-application-filler@local`, the ID of the existing listing on addons.mozilla.org, so this version can be published there. Firefox keeps each add-on's data under its ID: if you installed an earlier build by hand, export your profile before updating and import it afterwards.

## [0.2.0] - 2026-10-16

### Added

- Undo: "Undo fill" in the popup and "Undo" in the on-page notice put every filled field back the way it was. Custom dropdowns keep their choice; they are listed and outlined so you can change them back by hand.
- The popup explains the outlines: solid for filled, dashed for needs you.

### Changed

- Outlines differ in line style as well as colour (solid green for filled, dashed amber for needs you), so they no longer rely on telling green from amber.
- The profile page keeps its section links and the save status in view while you scroll.
- The floating "Fill application" button on known job sites is turned off for now. Fill from the toolbar popup or with Alt+Shift+F.
- Store descriptions no longer list job sites by name.

### Fixed

- "Do you hold a valid visa?" was answered with the sponsorship answer, the opposite question.
- Address line 2 was filled with the street.
- Short questions about "our company" were filled with the current employer.
- A CV upload in a form of its own was skipped.
- Filling changed a dropdown button that already showed your choice.
- An answer saved from the popup for a question containing commas was used for unrelated questions.
- Saved-answer keywords matched inside other words ("age" in "languages").
- A dropdown could pick a hidden option that belonged to another dropdown.
- Searchable dropdowns only tried your exact wording ("Deutschland" never found "Germany"), and left the typed text behind when nothing matched.
- Rich text editors could look filled but submit empty.
- An answer saved from the popup was lost when the profile page was open in another tab.
- The on-page notice after filling ("Filled 12 fields") showed in the page's default serif font instead of the system font.

## [0.1.0] - 2026-10-14

First release, for Firefox and Chromium browsers (Chrome, Edge, Brave).

### Added

- Profile page for personal details, address, links (LinkedIn, GitHub, Xing, portfolio), salary expectation, notice period, start date, work authorisation, education, voluntary disclosures, CV and cover letter files, and custom answers. Import, export and delete.
- One-click filling from the toolbar popup, the Alt+Shift+F shortcut, or an in-page button on known job sites. Never submits and never ticks consent boxes.
- Field recognition in English, German, French, Spanish, Italian, Dutch, Portuguese and Polish.
- Site support for Greenhouse, Lever, Ashby, Workday, Personio, SmartRecruiters, SAP SuccessFactors and LinkedIn Easy Apply; generic matching everywhere else.
- Dropdowns, radio and checkbox groups, custom comboboxes, phone country pickers, date formats per form, and CV upload.
- Green and amber outlines for filled and unanswered fields; the popup lists open questions and saves answers for next time.
