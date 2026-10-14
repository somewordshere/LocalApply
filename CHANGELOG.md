# Changelog

All notable changes to LocalApply. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

Add entries under **Unreleased** as you work. `npm run release` requires a section for the version in `package.json` and copies it into the release folder as the release notes.

## [Unreleased]

### Fixed

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
