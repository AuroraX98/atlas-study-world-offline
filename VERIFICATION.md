# Atlas Study World — verification report

Verified on 3 October 2026, using macOS and the Codex in-app browser. This is a review build, not a claim that every operating system, browser, or possible input has been tested.

## Navigation review fixes — v1.1.0-preview.3

The full [navigation review](NAVIGATION-REVIEW.md) records all 100 checks: 78 Pass, 0 Needs work, 3 Not applicable and 19 Not verified, each limited to its stated evidence. This is coverage, not a usability score or accessibility certification.

On 3 October 2026, an isolated database at 5181 verified all eight main pages, titles and content headings at desktop and requested 375×812 viewport with no horizontal page overflow. Assistant setup, practice and goal-horizon drafts survived navigation/reload. Practice/goal saves and journal immediate navigation worked. Search expanded all 111 sample results, handled a Physics typo, pinned and reopened an exact journal entry, and opened Backups through keyboard search. Skip navigation, dialog return, route heading focus and a narrow-screen action above the sticky timer were checked. A paused/ended timer credited 10 seconds; both weekly summaries counted the completed horizon goal. No browser console errors appeared. A final visual check corrected faint inactive Search tabs to use a foreground color.

Type checking, standalone build and the full automated suite passed, including bounded local drafts, late-save newer-text preservation, search ranking/paging and all earlier timer/storage/backup/lesson/export checks. Live AI requests were not needed for this navigation review; earlier real DeepSeek verification is retained below. Screen-reader, physical-device, translated-interface, large-history, direct-file and Windows checks remain explicit in the review.

## Navigation update — v1.1.0-preview.2

Checked on 3 October 2026 in an isolated browser database at port 5180. Existing personal progress at 5175 was not used for these tests.

Browser checks opened Today, Subjects, Study world, Goals, Rewards, Progress, Journal, and Assistant. A Physics topic carried its subject, aim, and difficulty into Assistant. Missing AI setup linked directly to the AI settings section. Continue studying reopened the topic, and refreshing retained the exact topic dialog. Journal writing survived immediate navigation; exact search reopened that journal entry and a specific goal. A pinned entry appeared on Today. Ctrl+K opened Search. A live topic timer remained available on Progress, paused, and ended with actual study time saved. Browser Back recovered an unfinished weekly reflection draft. Language selection opened the German subject workspace. Settings exposed separate Study preferences, AI assistant, and Data & backups sections. All eight pages fit the effective 375-pixel viewport without horizontal page overflow; the viewport was restored afterward. No browser console errors appeared during these navigation checks.

Regression checks cover navigation hash parsing, legacy path mapping, unknown settings/credentials excluded from saved routes, stale record fallback, exact result destinations, pin/recent limits, local draft validation/recovery, safe draft clearing when newer edits exist, and older gallery targets beyond list limits. Existing data, lesson, timer, backup, report, credential-request isolation, and journal checks still pass. Direct file opening and Windows hardware remain manual checks.

## Earlier preview verification

All seven main pages opened: Today, Study world, Learning, Quests, Collection, Journal, and Assistant. The core workflows passed the browser checks below. The source audit covered the remaining controls and handlers; automated checks covered data limits, concurrency, rewards, storage, exports, lessons, and provider requests.

A real DeepSeek lesson and follow-up succeeded using the existing saved macOS Keychain key. Completing the lesson saved its conversation, a practice record, a studied topic, 10 reported Spanish words, and two rewards. Reopening the app preserved the completed lesson. Generating the lesson added no study time. These were two real provider requests; OpenAI and Claude were tested with mock responses only.

All progress changes happened in a separate test database at port 5177. The main app database at port 5175 was kept intact. The actual key was loaded inside the companion, never displayed, copied into source, or placed in a backup. Keychain save/forget buttons were not used on the actual user key.

## Browser checks

| Area | Verified behavior |
| --- | --- |
| Navigation | Every main page opened; all built-in subject paths and all four difficulty stages opened. Dialogs opened and closed. |
| Study world | Island selection changed the subject and close-up; Whole world reset; custom subject appeared as an island; calm and focus/full layouts worked. |
| Timer | One-minute timer began, paused, resumed after reload, completed automatically and credited one minute. A separate custom-subject timer ended early and credited about 19 seconds. |
| Built-in learning | Whole Number Operations displayed plain explanations and definitions. The correct answer plus explanation checkbox enabled completion. Completion updated topic, practice, review schedule, and rewards. |
| Personal topics | Created a custom subject/topic, saved a note, previewed/copied the study prompt, and recorded practice and recall. |
| Languages | Spanish word count advanced from 10 to 100; the next milestones advanced to 150, 200, 250, 300, 350. German stayed at zero. Vocabulary review and completed language practice saved separately. |
| Goals | Weekly and five-year goals saved; quest steps, next action, effort estimate, pause/resume, completion, elapsed time, and reflection worked. A 31-step quest gave a clear validation message. |
| Collection | Next/Previous paging, Earned filter, and displaying an earned reward on an island worked. Other filters were checked through their handlers. |
| Journal | Writing autosaved. Immediate full-backup export included the newest text before the debounce delay. Word, Markdown and text downloads were produced and checked. A new blank draft stayed out of all-entry reports. |
| Weekly progress | Completed activities, reflections, built-in topic names, and custom-subject time appeared. Weekly report and goal poster downloaded as printable HTML. |
| Evidence | Practice saved and a small text file attached. The attachment appeared in search and was preserved by a backup merge. |
| Search | Results found topics, quests, practice, files, weekly reflections, and text inside a journal entry. Selecting the journal result opened Journal. |
| Backup | Invalid JSON backup format showed an error. Valid backup preview and merge kept newer records, avoided duplicate sessions/quests, and preserved the existing attachment. |
| Local key file | Explicit opt-in revealed the location; blank template creation, external dummy-key edit, status detection, automatic companion use, and provider-specific clearing worked. The cleared entry was empty on disk; another provider’s dummy entry remained. Turning access off disabled reads and restored the credential-store source. No real key file was populated. |
| Narrow layout | All seven pages had no horizontal page overflow at the browser’s effective 375-pixel width. The viewport was reset afterward. |

## Fixes made during verification

- Practice records now accept a maximum-length topic title.
- Topic and gallery evidence fields explain and validate HTTPS links.
- Quest forms explain the 30-step / 300-character limits and report violations clearly.
- Journal changes flush when navigating away and before full-backup export.
- All journal reports exclude empty new drafts, preserve existing entries, and sort dates.
- Weekly reports include custom subjects and show human topic names.
- Search includes every journal field and avoids rebuilding its achievement index on each timer tick. No infinite update loop was found; browser-tool timeouts recovered.
- Optional API-key file support, an empty template, setup/removal instructions, and private filename exclusions were added.

## Automated checks

TypeScript and the standalone build passed. The application suite passed timer accounting, all 50 language counts through 50,000 words, corrections and earned badges, all 96 built-in lessons, topic completion, custom subjects, goal horizons, journal and report exports, atomic database rollback, attachment backup validation, assistant locks/concurrent saves, idempotent completion, and key-free backups. Journal and weekly-report regressions passed against real IndexedDB transactions and generated report content.

The combined companion suite passed 39 checks with zero failures; one native credential-store test was skipped in this run. Companion tests cover strict payloads, exact local origin/host, size limits, provider-only routing, response redaction, saved-key isolation, file opt-in, refusal of arbitrary paths and mixed key sources, and failure without fallback. Local-file tests cover exclusive template creation, provider-specific clearing, concurrent clears, malformed/oversized files, symlinks, and Mac permissions. Mock provider calls do not contact an AI service.

The build embeds its JavaScript and CSS. Core progress and built-in lessons have no external runtime dependency. Full offline hardware/network testing was not performed; optional AI needs internet.

## Remaining manual checks in this public preview

- Run the app and Credential Manager behavior on an actual Windows computer.
- Open the HTML directly from disk in supported Mac and Windows browsers. This environment blocks automated file: navigation; HTTP loading is verified.
- Finish Save as PDF in a real browser print dialog and inspect the final PDF. The button reached the native dialog, but that dialog could not be controlled by the browser testing tool. Printable report content and downloaded Word/HTML files passed checks.
- Check installed language voices and audible playback manually. Voice availability varies by computer.
- Perform a clean-install walkthrough with the final ZIP on both platforms. This check did not click every individual reward card or every combination of settings.

## API-key file behavior

The optional file is plain UTF-8 JSON. Settings permission and file-source selection are required; the companion reads the selected provider’s entry automatically for a lesson. No key is returned to the browser. Clearing empties one entry and preserves the others. Creation keeps an existing file unchanged. Keychain/Credential Manager remains available for protected storage. Removing a local copy does not revoke the provider key.

The included example is empty. Filled api-keys.json files are excluded by .gitignore and are outside the app source by default. Progress backups and the review ZIP exclude populated files. Do not manually upload a filled key file to GitHub.

## Publication checks — 3 October 2026

The public preview includes the island purpose guide, AI Assistant wording for study prompts across all subjects, and the language-dropdown note pointing to Assistant. These changes passed TypeScript, standalone build, and browser checks. The guide opened with mouse and keyboard; copying a study prompt showed the updated confirmation. Source, documentation, and packaged downloads exclude private progress and populated key files. The release retains the remaining manual platform checks above.
