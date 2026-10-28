# LocalApply 0.10.0

Released 2026-10-28.

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
