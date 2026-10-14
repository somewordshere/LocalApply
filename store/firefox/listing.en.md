# Firefox listing (English, default locale)

Copy each block into the matching field at addons.mozilla.org → Developer Hub → Submit a New Add-on → "On this site". The summary is plain text; the description supports a limited Markdown (bold, italic, links, lists, blockquotes, code; no headings). Written following Mozilla's [Create an appealing listing](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/) guide.

**Compatible with:** Firefox for desktop only (the add-on relies on a toolbar popup and a keyboard shortcut).

## Name (45 / 50 characters)

```
LocalApply – Private Job Application Autofill
```

## Add-on URL

```
localapply
```

## Summary (up to 250 characters)

In [`summary.en.txt`](summary.en.txt), ready to paste as-is.

## Description

In [`description.en.md`](description.en.md), ready to paste as-is.

## Other fields

| Field                   | Value                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| Categories              | Other (up to two allowed; add a second only if it truly fits)                 |
| Tags                    | Pick from the fixed list in the form; privacy and productivity fit if offered |
| Platforms               | Windows, macOS, Linux; not Android                                            |
| Support email / website | Mozilla recommends at least a support email (shown publicly)                  |
| License                 | Your choice: MIT if others may reuse the code, All Rights Reserved if not     |
| Privacy policy          | Not required; optional text in `../privacy-policy.md`                         |
| Notes to reviewer       | `reviewer-notes.md`                                                           |

## Screenshots

Upload in this order from `../screenshots/`.

| File                      | Caption                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `1-fill-in-one-click.png` | Click Fill and the application is filled from your profile. You review and submit.    |
| `2-profile.png`           | Enter your details once: contact, address, links, salary, availability and documents. |
| `3-whats-left.png`        | Green is filled, amber needs you. Save an answer and it is reused next time.          |
| `4-languages.png`         | Recognises form labels in eight languages, here a German application.                 |
| `5-private.png`           | Everything stays in your browser. Export or delete your data any time.                |
