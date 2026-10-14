# Store listings

Everything the Firefox Add-ons site and the Chrome Web Store ask for, kept next to the code so it changes together with it.

```
store/
  privacy-policy.md          shared privacy statement (optional for both stores; see below)
  screenshots/               1280×800 PNGs, used by both stores (generated)
  firefox/
    listing.en.md            name, summary, description (HTML subset), captions, categories
    listing.de.md            German translation of the listing
    reviewer-notes.md        "Notes to reviewer" field: how to rebuild from source, why each permission
  chrome/
    listing.en.md            description (plain text), category, captions
    listing.de.md            German description, for when the extension is localised
    privacy-practices.md     answers for the Privacy practices tab: single purpose, permissions, data use
    icon-128.png             store icon, 96 px artwork with 16 px padding (generated)
    promo-tile-440x280.png   small promo tile, required by Chrome (generated)
```

## Regenerating the images

| Command                | Produces                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run store-assets` | `screenshots/*.png` and `chrome/promo-tile-440x280.png` from the built UI    |
| `npm run icons`        | `public/icon/*.png` (in the extension) and `chrome/icon-128.png` (the store) |

The screenshots show the real extension filling fictional job pages for a made-up person (Alex Morgan). Regenerate them whenever the popup, the profile page or the in-page highlights change. The first run needs `npx playwright install chromium`.

## Where each piece goes

### Firefox: addons.mozilla.org → Developer Hub

| Form field                        | Source                                                     |
| --------------------------------- | ---------------------------------------------------------- |
| Add-on file                       | `releases/v<version>/localapply-<version>-firefox.zip`     |
| Source code                       | `releases/v<version>/localapply-<version>-sources.zip`     |
| Name, summary, description        | `firefox/listing.en.md` (German under Manage translations) |
| Screenshots and captions          | `screenshots/`, captions in `firefox/listing.en.md`        |
| Notes to reviewer                 | `firefox/reviewer-notes.md`                                |
| Release notes (on version update) | `releases/v<version>/RELEASE_NOTES.md`                     |
| Privacy policy                    | Not required (the manifest declares no data collection)    |

### Chrome Web Store → Developer Dashboard

| Tab / field           | Source                                                                       |
| --------------------- | ---------------------------------------------------------------------------- |
| Package               | `releases/v<version>/localapply-<version>-chrome.zip`                        |
| Title and summary     | Taken from the manifest (`wxt.config.ts`: `name`, `description` ≤ 132 chars) |
| Description, category | `chrome/listing.en.md`                                                       |
| Store icon            | `chrome/icon-128.png`                                                        |
| Screenshots           | `screenshots/` (up to 5)                                                     |
| Small promo tile      | `chrome/promo-tile-440x280.png`                                              |
| Privacy practices     | `chrome/privacy-practices.md`                                                |

A Chrome Web Store developer account costs a one-time US$5 registration fee.

## Keeping listings honest

- Only claim sites that have been tried on a real posting. Built-in support for Workday, Lever, SmartRecruiters, SAP SuccessFactors and LinkedIn Easy Apply exists in `src/adapters/` but had not been tried on live postings as of v0.1.0.
- The extension's own interface is English only, so the German listings describe a German-recognising tool, not a German interface.
- Update the "What it fills" lists when a profile field is added.
