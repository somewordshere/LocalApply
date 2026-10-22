# Chrome Web Store listing (English)

Fill in at the Chrome Web Store Developer Dashboard → your item → Store listing. The description is plain text: no HTML or Markdown, line breaks are kept.

## Title and summary

Chrome takes both from the manifest (`wxt.config.ts`), so they change only with a new upload:

| Field   | Value                                                                                                                          | Limit |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ----- |
| Title   | LocalApply – Job Application Autofill, No Account, No Subscription                                                             | 75    |
| Summary | Autofill job applications in one click. Free, no account, no subscription. Works offline; your data never leaves your browser. | 132   |

## Description

In [`description.en.txt`](description.en.txt), ready to paste as-is.

## Other fields

| Field                                | Value                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| Category                             | Productivity → Workflow & Planning                      |
| Language                             | English                                                 |
| Store icon                           | `icon-128.png`                                          |
| Screenshots                          | `../screenshots/` 1 to 5 (1280×800), in file-name order |
| Small promo tile                     | `promo-tile-440x280.png`                                |
| Marquee promo tile                   | Optional (1400×560); not provided                       |
| Official / homepage URL, support URL | Optional; your project page if you have one             |

Chrome shows no per-screenshot captions, and the screenshots carry no text, so the description does the explaining.
