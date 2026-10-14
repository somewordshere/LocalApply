# Chrome Web Store listing (English)

Fill in at the Chrome Web Store Developer Dashboard → your item → Store listing. The description is plain text: no HTML or Markdown, line breaks are kept.

## Title and summary

Chrome takes both from the manifest (`wxt.config.ts`), so they change only with a new upload:

| Field   | Value                                                                                                                | Limit |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ----- |
| Title   | LocalApply – Private Job Application Autofill                                                                        | 75    |
| Summary | Fills job application forms from your saved profile in one click. Works offline; your data never leaves the browser. | 132   |

## Description

```
Applying for jobs means typing the same details into every form. LocalApply keeps them in one profile and fills the application you have open with a single click. You check the form and press Submit yourself.

WHAT IT FILLS
• Name, email, phone (including country-code pickers), address and date of birth
• LinkedIn, GitHub, Xing and portfolio links
• Salary expectation, notice period, earliest start date and years of experience
• Work authorisation, visa sponsorship and relocation questions
• Current job title, employer and education
• Your CV and cover letter files, and cover letter text
• Your own answers to recurring questions such as "How did you hear about us?"

WORKS WHERE YOU APPLY
Fills forms on Greenhouse, Ashby, Personio, Recruitee, Teamtailor and ordinary company career pages, and has dedicated support for Workday, Lever, SmartRecruiters, SAP SuccessFactors and LinkedIn Easy Apply. Form labels are recognised in English, German, French, Spanish, Italian, Dutch, Portuguese and Polish.

HOW IT WORKS
1. Enter your details once on the profile page.
2. On an application, click the toolbar button, press Alt+Shift+F, or use the "Fill application" button that appears on supported job sites.
3. Filled fields are outlined in green. Required fields it could not answer are outlined in amber and listed in the popup, where you can save an answer for next time.

PRIVATE BY DESIGN
• Your profile and documents are stored only in your browser on your computer.
• No account, no server, no AI service, no analytics. The extension makes no network requests.
• It never presses Submit or Next and never ticks consent boxes.
• Fields you have already filled in are left alone.
• Export your profile to a file, or delete everything with one click.

WHY IT ASKS TO READ AND CHANGE DATA ON ALL WEBSITES
Job applications live on thousands of different domains, often inside embedded frames, so LocalApply needs to be able to fill form fields on any page. It only reads or changes a page's form when you ask it to fill.
```

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

Chrome shows no per-screenshot captions; the headline is in each image.
