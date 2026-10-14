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

| Field                   | Value                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Categories              | Other (up to two allowed; add a second only if it truly fits)                                                                         |
| Tags                    | Pick from the fixed list in the form; privacy and productivity fit if offered                                                         |
| Platforms               | Windows, macOS, Linux; not Android                                                                                                    |
| Support email / website | Mozilla recommends at least a support email (shown publicly)                                                                          |
| License                 | Your choice: MIT if others may reuse the code, All Rights Reserved if not                                                             |
| Privacy policy          | Optional for Firefox (nothing is transmitted); paste the text of [`PRIVACY.md`](../../PRIVACY.md) so both stores show the same policy |
| Notes to reviewer       | `reviewer-notes.md`                                                                                                                   |

## Screenshots

Upload in this order from `../screenshots/`. The images carry no text, as Mozilla recommends (one set is shown in every language), so the captions tell the story.

| File                       | Caption                                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1-fill-in-one-click.png`  | One click fills the application from your profile: contact details, links, salary, work authorisation and your CV. Green outlines show what was filled.    |
| `2-saved-answers.png`      | A saved answer fills "Why do you want to join?". Questions LocalApply can't answer are outlined in amber; save your reply once and it is reused next time. |
| `3-any-language.png`       | Works in eight languages. Here a German application, with salutation, address, date of birth and start date in the format the form expects.                |
| `4-profile.png`            | Enter your details once on the profile page. Everything is stored in your browser only.                                                                    |
| `5-answers-and-backup.png` | Keep answers to recurring questions, and export or delete all your data at any time.                                                                       |
