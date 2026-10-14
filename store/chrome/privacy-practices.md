# Chrome Web Store: Privacy practices tab

Answers for the Developer Dashboard → your item → **Privacy practices**. Field by field, in the order the dashboard shows them.

Under the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), data stored only on the user's device still counts as handled and must be disclosed, and any extension that handles personal data must link a privacy policy. Disclosures, the privacy policy and the extension's behaviour must agree; mismatches can lead to suspension. Re-check this file whenever a release adds a permission, a profile field, or any network request.

## Single purpose description

```
Fills job application forms on the current page with information the user has saved in the extension: contact details, address, professional links, salary expectation, availability, CV and cover letter, and saved answers to common application questions.
```

## Permission justifications

The dashboard lists the permissions from the manifest. Paste one answer per field.

**storage**

```
Stores the user's profile (contact details, documents and saved answers) in the browser on the user's device, so it can be written into job application forms when the user asks.
```

**unlimitedStorage**

```
The user's CV and cover letter files are stored locally as data URLs and can exceed the default 10 MB storage quota.
```

**Host permission** (from the content script that runs on all sites)

```
Job application forms are hosted on thousands of employer and applicant-tracking domains and are often embedded in iframes, so the form filler has to be able to run on any page. It reads and fills form fields only when the user clicks "Fill this page", presses the keyboard shortcut, or clicks the "Fill application" button. On a fixed list of applicant-tracking sites it also checks whether an application form is open, so it can show that button. It never submits forms, and it sends no data anywhere.
```

## Remote code

Select **No, I am not using remote code.**

## Data usage

### What user data do you plan to collect from users now or in the future?

| Category                            | Tick? | Why                                                                                                                                   |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Personally identifiable information | Yes   | Name, address, email, phone number, date of birth and nationality are stored in the profile.                                          |
| Health information                  | Yes   | The optional "Disability" answer (for equal-opportunity questions) is health-related. Declaring it is the safe reading of the policy. |
| Financial and payment information   | No    | Salary expectation is not financial account or payment data.                                                                          |
| Authentication information          | No    | No passwords, logins or credentials are stored; password fields are skipped.                                                          |
| Personal communications             | No    | No emails, texts or chat messages.                                                                                                    |
| Location                            | No    | The postal address the user types is covered under personally identifiable information; no device location or IP is used.             |
| Web history                         | No    | Visited sites are not recorded.                                                                                                       |
| User activity                       | No    | No clicks, keystrokes or browsing behaviour are monitored.                                                                            |
| Website content                     | No    | Form labels are read in memory to decide where to type, and nothing from the page is stored or sent.                                  |

If you drop the voluntary "Disability" field from the extension in a future release, you can untick Health information.

### Certifications

Tick all three:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy URL

```
https://github.com/somewordshere/LocalApply/blob/main/PRIVACY.md
```

The policy is [`PRIVACY.md`](../../PRIVACY.md) in the repository root. It includes the Limited Use statement the policy asks for. The link only works once the file is pushed to GitHub.
