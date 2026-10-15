# LocalApply 0.2.0

Released 2026-10-16.

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
