# Changelog

All notable changes to LocalApply. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

Add entries under **Unreleased** as you work. `npm run release` requires a section for the version in `package.json` and copies it into the release folder as the release notes.

## [Unreleased]

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
