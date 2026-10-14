# Chrome Web Store: Privacy practices tab

Answers for the Developer Dashboard → your item → Privacy practices. Review them whenever a release adds a permission or starts sending data anywhere.

## Single purpose

```
Fills job application forms on the current page from a profile the user saves in the extension (contact details, address, links, salary expectation, availability, documents and saved answers).
```

## Permission justifications

| Permission                                    | Justification                                                                                                                                                                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                     | Stores the user's profile, documents and saved answers locally so they can be written into application forms.                                                                                                                                        |
| `unlimitedStorage`                            | The user's CV and cover letter files are stored locally as data URLs and can exceed the default storage quota.                                                                                                                                       |
| Host permission (content script on all sites) | Job application forms are hosted on thousands of employer and applicant-tracking domains and are often embedded in iframes, so the form filler must be able to run on any page. It reads and changes form fields only when the user asks it to fill. |

## Remote code

```
No, I am not using remote code.
```

## Data usage

LocalApply keeps the user's data on the device and never transmits it, so under Chrome Web Store definitions it collects no user data. Leave every data category unchecked:

- Personally identifiable information: not collected
- Health information: not collected
- Financial and payment information: not collected
- Authentication information: not collected
- Personal communications: not collected
- Location: not collected
- Web history: not collected
- User activity: not collected
- Website content: not collected

Then tick all three certifications:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

Not required when no user data is collected. If you publish `../privacy-policy.md` somewhere, link it here.
