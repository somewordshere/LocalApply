# Architecture

LocalApply is a [WXT](https://wxt.dev) extension: one codebase builds a Chrome Manifest V3 extension and a Firefox Manifest V2 add-on. The UI is React with Tailwind CSS; everything else is plain TypeScript.

## How a fill happens

```
popup "Fill this page" ───────┐
Alt+Shift+F ──► background ───┴──► content script (every frame of the tab) ──► engine.fillPage()
                                                                                      │
                                                                                      ▼
                                       scan ──► match ──► resolve ──► fill ──► report
                                                                                      │
popup  ◄──────────── fill-start / fill-result messages (one per frame) ◄──────────────┘
```

1. **Trigger.** The popup sends `fill` straight to the active tab. The keyboard shortcut goes through the background script, which sends `fill` to the tab. Undo works the same way with `undo`: from the popup directly, from the on-page notice through the background script. Messages are typed in `src/core/messages.ts`.
2. **Content script** (`entrypoints/content.ts`) runs in every frame, because many application forms are iframes. It loads the profile, calls `fillPage`, shows a notice with an Undo link, and reports the result back. It can also show a floating "Fill application" button while a known job site's form is on screen; that button is turned off for now (`SHOW_PAGE_BUTTON`).
3. **Engine** (`src/engine/`):
   - `scan.ts` finds fillable controls (including open shadow DOM), works out each one's label, and groups radios and same-named checkboxes into one question. It skips hidden fields, navigation, search boxes and cookie dialogs.
   - `match.ts` maps each field to a profile key: site adapter selectors first, then the autocomplete attribute, the label, the name and id attributes, and the input type, scored per rule in `rules/`. Fields it can't place are tried against the user's custom answers.
   - `resolve.ts` turns a profile key into the values to try: the text to type, plus alternatives for picking dropdown options (country names in several languages, Yes/No in eight languages).
   - `fill.ts` writes values so frameworks notice (React, Angular, Vue), picks dropdown and radio options, drives custom comboboxes, formats dates per form, and attaches files.
   - `report.ts` outlines filled fields with a solid green line and unanswered required fields with a dashed amber one, so the two differ without relying on colour.
   - `undo.ts` records each field's state just before it is filled, so the last fill can be taken back. Custom dropdowns keep their choice and are listed for the applicant to change by hand.
   - `index.ts` orchestrates this and skips newsletter forms that share the page with the application.
4. **Result.** The popup collects one result per frame and lists unanswered questions, each with "Save answer", which adds a custom answer to the profile.

## Data

The profile (`src/profile/schema.ts`) is one object in `storage.local`, including documents as data URLs. `migrate()` turns anything read from storage or an imported file into a complete, current profile, running the version upgrades in `src/profile/migrations.ts` first.

Nothing leaves the browser. The extension has no network code; keep it that way, since both store listings and the Firefox data-collection declaration (`wxt.config.ts`) promise it.

## Where to change things

| Change                                        | Files                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| A label isn't recognised                      | `src/engine/rules/locales/<language>.ts`                                 |
| A new kind of information to fill             | See [extending.md](extending.md#add-a-profile-field)                     |
| A job site needs special handling             | `src/adapters/<site>.ts`                                                 |
| How values are written into a kind of control | `src/engine/fill.ts`                                                     |
| Which elements count as fields, label finding | `src/engine/scan.ts`                                                     |
| Profile page                                  | `entrypoints/options/` (field list in `fields.ts`, cards in `sections/`) |
| Popup                                         | `entrypoints/popup/App.tsx`                                              |
| Manifest, permissions, build                  | `wxt.config.ts`                                                          |

## Tests

- `tests/unit/` (Vitest with jsdom) covers the engine and the profile. `regressions.test.ts` holds cases taken from bugs found on real job sites; add one whenever you fix a site-specific bug.
- `tests/e2e/chrome.mjs` (Playwright) loads the built extension into Chromium and drives the profile page, popup, undo and shortcut path against fixture pages served by request interception.
- `tests/fixtures/` holds sample forms. They are excluded from Prettier so their markup stays exactly as written.
