# Extending LocalApply

Run `npm run check` after any of these, and `npm run test:e2e` when the popup or profile page changed.

## Teach it a label it misses

Find the field in `src/engine/rules/locales/<language>.ts` and add the phrase. Write it the way `norm()` leaves label text: lowercase, accents removed (`ß` becomes `ss`), punctuation as spaces. Regex fragments are allowed, for example `gehalt\\p{L}*` for every word starting with "gehalt". Each phrase matches whole words only.

If the field picks up labels it shouldn't, add the giveaway word to that locale's `exclude` for the field. Then add a test to `tests/unit/regressions.test.ts` with the label that was missed or mismatched.

## Add a language

1. Create `src/engine/rules/locales/<code>.ts` exporting a `Locale` (copy `nl.ts` as a starting point). Fill in `fields` for as many keys as you can; missing keys are fine.
2. Add it to the list in `src/engine/rules/locales/index.ts`.
3. If the language has its own words for Yes and No, gender or salutation options, or country names, add them to the tables at the top of `src/engine/resolve.ts`.
4. If its date placeholders use other letters than `dd/mm/yyyy`, `tt.mm.jjjj`, `jj/mm/aaaa` or `dd.mm.rrrr`, extend the pattern in `formatDate()` (`src/engine/fill.ts`).
5. Add a form for it to `tests/fixtures/multilingual.html` and its expected values to `tests/unit/forms.test.ts`.
6. Mention it in the store listings (`store/*/listing.*.md`) and the screenshot slide in `scripts/store-assets.mjs`.

## Add a job site

1. Create `src/adapters/<site>.ts` exporting an `Adapter` (see `src/adapters/types.ts`; `lever.ts` is a short example):
   - `matches`: usually `host(/(^|\.)example\.com$/)`;
   - `hints`: CSS selectors that identify fields outright, for fields whose labels the generic rules get wrong;
   - optional `scope` (limit scanning to the application dialog) and `ready` (when to show the in-page button on single-page sites).
2. Add it to `ADAPTERS` in `src/adapters/index.ts`.
3. Add a reduced copy of the site's form to `tests/fixtures/ats.html` and a test to `tests/unit/adapters.test.ts`.
4. Try it on a live posting before listing the site in the store descriptions.

## Add a profile field

1. **Data:** add the property to `Profile` and to `emptyProfile` in `src/profile/schema.ts`. A new field with a default needs no migration: `migrate()` fills in missing fields.
2. **Profile page:** add an entry to `FIELD_SECTIONS` in `entrypoints/options/fields.ts`. Fields that aren't plain strings (lists, files) need their own card in `entrypoints/options/sections/`.
3. **Recognition:** add the key to `FieldKey` in `src/engine/types.ts`, an entry to `FIELD_RULES` in `src/engine/rules/fields.ts` (its position sets priority), and phrases to each locale.
4. **Value:** if the stored value isn't typed as-is, add a case to `resolve()` in `src/engine/resolve.ts` (for example, alternatives for dropdowns). Yes/no questions also go in `YES_NO_KEYS`, dates in `DATE_KEYS`.
5. **Tests:** add the field to a fixture form and to the expected values.
6. **Store:** update the "What it fills" lists in the listings.

## Change the shape of stored data

Renaming, splitting or retyping an existing profile property would break profiles users already saved. Append an upgrade step to `MIGRATIONS` in `src/profile/migrations.ts` instead; the version number follows automatically. Never edit a step that has shipped. Add a test to `tests/unit/profile.test.ts` that feeds the old shape through `migrate()`.

## Add a permission

Avoid it if you can: each one shows up in the install prompt and needs a justification in both stores. If needed, add it in `wxt.config.ts`, then update `store/chrome/privacy-practices.md`, `store/firefox/reviewer-notes.md` and the "Why it asks for access" paragraphs in the listings.
