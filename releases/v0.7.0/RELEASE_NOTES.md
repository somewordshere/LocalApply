# LocalApply 0.7.0

Released 2026-10-22.

### Added

- Spoken languages with a level (A1 to C2, or native). A "Languages" box gets the list; a question about one language ("Deutschkenntnisse", "proficiency in English", "Niveau d'allemand") gets that language's level in the form's own wording.
- Driving licence (yes/no and classes), willingness to travel, and minimum and maximum salary, each recognised in all eight languages. The salary range falls back to the expected salary.
- `{company}` and `{position}` in the cover letter and saved answers are replaced with the employer and job title read from the posting, also when the form is in an embedded frame. A text the page can't complete is left open rather than filled with a gap.
- Application log: each filled form is noted with date, company, job title and link, in the browser only. On by default; turn it off, remove entries, clear it or export it as CSV in the new Applications section. "Delete all data" clears it too.

### Changed

- Optional fields (salary range, licence classes) don't count against how complete the profile is.
- The privacy policy and the Chrome Web Store data disclosures describe the application log.
