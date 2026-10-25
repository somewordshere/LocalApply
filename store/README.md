# Store listings

Everything the Firefox Add-ons site and the Chrome Web Store ask for, kept next to the code so it changes together with it.

Every text exists in the eight interface languages: `<l>` is `en`, `de`, `fr`, `es`, `it`, `nl`, `pt` or `pl`. The extension's name, summary and shortcut name come from `public/_locales/<l>/messages.json` in the package, so both stores and the browser show them in the user's language. Firefox gets its own, shorter name (`extNameFirefox`, ≤ 50 characters) because addons.mozilla.org allows 50 where the Chrome Web Store allows 75 (`extName`).

```
store/
  screenshots/               1280×800 PNGs without text, for Firefox (generated)
  firefox/
    description.<l>.md       description, ready to paste (Firefox supports a limited Markdown)
    summary.<l>.txt          summary, ready to paste (≤ 250 characters)
    listing.en.md            name, captions, categories and other form fields
    listing.<l>.md           name and captions in each other language
    reviewer-notes.md        "Notes to reviewer" field: how to rebuild from source, why each permission
  chrome/
    description.<l>.txt      description, ready to paste (plain text)
    listing.en.md            category, images and other form fields
    listing.<l>.md           notes on each other language's listing
    privacy-practices.md     answers for the Privacy practices tab: single purpose, permissions, data use
    screenshots/             1280×800 slides with headlines, for Chrome (generated)
    icon-128.png             store icon, 96 px artwork with 16 px padding (generated)
    promo-tile-440x280.png   small promo tile, required by Chrome (generated)
```

## Regenerating the images

| Command                | Produces                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `npm run store-assets` | `screenshots/*.png`, `chrome/screenshots/*.png` and `chrome/promo-tile-440x280.png` from the built UI |
| `npm run icons`        | `public/icon/*.png` (in the extension) and `chrome/icon-128.png` (the store)                          |

All images show the real extension filling fictional job pages for a made-up person (Alex Morgan). The two stores get different screenshots:

- **Firefox** (`screenshots/`): the extension at its real size, in a plain browser frame with the popup under its toolbar button. No marketing text, as Mozilla recommends because one set is shown in every language; the captions in `firefox/listing.*.md` carry the story.
- **Chrome** (`chrome/screenshots/`): Chrome shows no captions, so each screenshot is a slide on the brand green with one headline and the real UI cropped and enlarged: filling in one click, free and private, saved answers, eight languages, the profile and the application log. The headlines are English and their claims match `chrome/description.en.txt`; change both together.

Regenerate them whenever the popup, the profile page or the in-page highlights change. The first run needs `npx playwright install chromium`.

## Where each piece goes

### Firefox: addons.mozilla.org → Developer Hub

| Form field                        | Source                                                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Add-on file                       | `releases/v<version>/localapply-<version>-firefox.zip`                                                                                 |
| Source code                       | `releases/v<version>/localapply-<version>-sources.zip`                                                                                 |
| Name                              | `extNameFirefox` in the package; copy in `firefox/listing.en.md` (other languages under Manage translations: `firefox/listing.<l>.md`) |
| Summary                           | `firefox/summary.<l>.txt`                                                                                                              |
| Description                       | `firefox/description.<l>.md`                                                                                                           |
| Screenshots and captions          | `screenshots/`, captions in `firefox/listing.en.md`                                                                                    |
| Notes to reviewer                 | `firefox/reviewer-notes.md`                                                                                                            |
| Release notes (on version update) | `releases/v<version>/RELEASE_NOTES.md`                                                                                                 |
| Privacy policy                    | Optional; paste the text of `PRIVACY.md` (repository root)                                                                             |

### Chrome Web Store → Developer Dashboard

| Tab / field                           | Source                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Package                               | `releases/v<version>/localapply-<version>-chrome.zip`                                                           |
| Title and summary                     | Taken from the package: `public/_locales/<l>/messages.json` (`extName` ≤ 75, `extDescription` ≤ 132 characters) |
| Description                           | `chrome/description.<l>.txt` (one per language in the language menu)                                            |
| Category                              | `chrome/listing.en.md`                                                                                          |
| Store icon                            | `chrome/icon-128.png`                                                                                           |
| Screenshots                           | `chrome/screenshots/` (up to 5)                                                                                 |
| Small promo tile                      | `chrome/promo-tile-440x280.png`                                                                                 |
| Privacy practices, privacy policy URL | `chrome/privacy-practices.md` (policy: `PRIVACY.md` in the repository root)                                     |

A Chrome Web Store developer account costs a one-time US$5 registration fee.

## Keeping listings honest

- Don't list job-site or ATS brand names in the Chrome description. The Chrome Web Store rejected v0.1.0 for keyword spam ("Yellow Argon") over a sentence naming Greenhouse, Workday, Lever and others. Describe coverage in general terms instead.
- Only claim sites that have been tried on a real posting. Built-in support for Workday, Lever, SmartRecruiters, SAP SuccessFactors and LinkedIn Easy Apply exists in `src/adapters/` but had not been tried on live postings as of v0.1.0.
- The extension's own interface (profile page, popup, on-page notice) is translated into the same eight languages it recognises in forms: English, German, French, Spanish, Italian, Dutch, Portuguese and Polish. It starts in the browser's language and can be switched on the profile page. New interface text goes into `src/ui/i18n/en.ts` and every other language file there; the compiler refuses a language that misses a message.
- Update the "What it fills" lists when a profile field is added.
