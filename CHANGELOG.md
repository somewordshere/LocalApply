# Changelog

All notable changes to LocalApply. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

Add entries under **Unreleased** as you work. `npm run release` requires a section for the version in `package.json` and copies it into the release folder as the release notes.

## [Unreleased]

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
