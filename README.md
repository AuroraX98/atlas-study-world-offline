# Atlas Study World — Offline Study Tracker, Study Planner & Pomodoro Timer

**Current public preview: v1.1.0-preview.3.** The latest app includes built-in lessons and optional AI assistance. See [verification and remaining platform checks](VERIFICATION.md) and the [100-check navigation review](NAVIGATION-REVIEW.md).

**An offline study tracker and study planner for macOS and Windows.** Download one HTML file to track study time with a Pomodoro timer, organize short-term and long-term goals, review weekly progress, and keep a personal study journal. Automatic local saving and 3D achievement islands help you see your progress, with no login required.

Support your **language learning** with a vocabulary tracker for 50 languages and reachable word-count milestones through 50,000 words. Explore 96 built-in lessons in Math, Physics, Quantum Physics, Coding, AI, and Art. An optional **AI study assistant** can generate personalized lessons with DeepSeek, OpenAI, or Claude; it requires internet access and your own API account.

This source includes an **offline exercise bank for every one of the 96 declared topics**. Open **Subjects → Practice**, choose a topic, and use its practice sets. Choose a skill, core or extension path, and task without forced repetition. Guided work, independent attempts, reasoning, applications, and fresh review come with staged hints, worked steps explaining why, and common mistakes. Writing, design, and art tasks use explicit self-review rubrics; Atlas does not automatically grade them. Specialist exercises extend the introductory lessons with calculations and projects while keeping their assumptions visible. The new banks await subject specialist review and do not constitute a complete external syllabus.

Exercise drafts autosave to the local workspace after a short typing pause. A browser recovery draft protects unfinished typing until that save succeeds. **Check & save answer** records the answer check; **Save my self-review** records the learner's own review. Start another attempt to revise a submitted answer. Saved attempts retain hints and solution exposure, and the app distinguishes opened lessons, introductory checks, tasks attempted, first answers checked without help, applications attempted, and fresh answers checked after a day. These records and the existing self-assessment rewards do not establish mastery or retention. Review reminders offer unseen review items until that finite set has been used; revisits remain available afterward.

Progress exports now use **backup version 3**, including saved exercise drafts, attempts, and lesson openings. Existing version 2 and legacy backups still import with empty practice-attempt fields. Matching attempt IDs keep the current local record; conflicting exercise identity or unsupported content versions reject the import before any records merge. Save or export before moving the HTML file or changing browser profiles. Language choices and custom subjects continue to support personal study; they do not include preauthored complete courses.

[**Download Atlas HTML**](https://github.com/AuroraX98/atlas-study-world-offline/releases/download/v1.1.0-preview.3/atlas-study-world.html) · [**Download app + companion ZIP**](https://github.com/AuroraX98/atlas-study-world-offline/releases/download/v1.1.0-preview.3/Atlas-Study-World.zip) · [Current preview release](https://github.com/AuroraX98/atlas-study-world-offline/releases/tag/v1.1.0-preview.3) · [Quick start](QUICK-START.md)

## Find your way around

- **Today:** Continue studying, recent items, pinned favorites, your daily plan, and reviews.
- **Subjects:** Choose a subject or language. Its Overview, Learning path, Notes, Practice, and Rewards stay together. Start studying prepares the timer; Generate an AI lesson carries your subject into Assistant.
- **Study world:** Explore islands and use the full focus timer. An active timer remains available while you visit other pages.
- **Goals / Rewards / Progress / Journal / Assistant:** Plan goals; explore achievements; review weekly reports and study history; write personal entries; or build optional AI lessons.

Use **Search** (Cmd+K on Mac, Ctrl+K on Windows) to open a specific topic, goal, journal entry, practice record, file, reward, weekly reflection, or saved AI lesson. Pin useful search results for quick access on Today. Use browser Back and the location trail to return to earlier sections. Atlas remembers the selected subject, subsection, filters, and scroll position in this browser. Continue studying reopens your last study place without starting a new timer.

**Settings** has Study preferences, AI assistant, and Data & backups. **Backups** opens that data section directly. AI forms show outstanding requirements with links to the relevant fields. Expand Help finding your way or the local help beside a form for short explanations.

Navigation, recent items, pins, and local writing drafts are browser convenience settings separate from the progress database. Pins retain titles and location IDs; they do not store note bodies or API keys. Progress backups include saved records, not these convenience settings. Finish saving weekly reflections, completed practice and goal drafts to include them in reports and backups. Assistant setup, unsent answers and word-count drafts remain in this browser until submitted; copy unfinished text before moving computers. A failed save keeps the current journal draft and prevents leaving that editor.

## Start studying

1. Download `atlas-study-world.html` from the current preview release.
2. Keep it in a permanent folder and open it in Chrome or Edge using a normal browser window.
3. Choose a subject or language, add a goal, and start a focus session.
4. Use **Export progress** regularly to save a full backup, including attachments and journal entries.

The app includes all its JavaScript, styles, and 3D graphics. Tracking works without a network connection or local server. Reference websites and the optional AI study assistant require internet access.

## What you can track

- **Included lessons and practice:** 96 introductory lessons explain the declared Math, Physics, Quantum Physics, Coding, AI, and Art topics with examples and definitions. Each has an offline skill map and exercise bank. The introductory check plus your explanation checkbox preserves the existing self-assessment reward. The separate exercise bank records specific attempts and checked answers, with rubric-based self-review for open work.
- **Optional study assistant:** Choose OpenAI, Claude, or DeepSeek in Settings. Build lessons around your subject, aim, difficulty, duration, tone, format, and explanation depth. Language lessons support any combination of reading, listening, grammar, and vocabulary, each with its own topic and level. Saved conversations remain local, and completion syncs actual timer time, practice, studied topics, and the word count you report. AI is disabled by default.
- **Study and learning:** Math, Physics, Quantum Physics, Coding, AI, Art, and 50 language choices. Add your own subjects and personal learning milestones.
- **Focus and achievements:** Pomodoro study time credited automatically to the selected subject; pauses and breaks excluded; hour levels, topic badges, practice, review, goal, and vocabulary achievements. Display rewards from Rewards on immersive 3D islands or use calm mode.
- **Language vocabulary:** Separate word counts and reviews for each language; 243 reachable vocabulary milestones through 50,000 words. After 100 words, the next milestones are 150, 200, 250, 300, and 350. Counts are self-reported; entering the actual words is optional and not required.
- **Goals and weekly progress:** Quests with steps and time invested; a goal board in Goals for this week, this month, six months, one year, and five years; weekly study charts and accomplishment reports in Progress. Download printable HTML posters or choose **Print / Save PDF**.
- **Journal and study materials:** Autosaving journal entries with prompts for events, challenges, lessons, goals, and vision. Export one entry or the complete journal as Word `.docx`, Markdown, text, or through **Print / Save PDF**. Keep topic notes, study questions, and local attachments together. Copy a study prompt into your chosen AI Assistant when desired.

## Where your data lives

Your progress and attachment copies are stored in an **IndexedDB database in your browser profile on this computer**. They are not embedded in the downloaded HTML file and are not uploaded to GitHub or a server. Automatic saving confirms completed database transactions. A short-lived typing draft is also kept locally to recover unfinished writing.

Use the same file location, browser, and browser profile for everyday use. Avoid private/incognito windows for a lasting workspace. Browser storage can be removed when browser data is cleared. **Export a backup before moving the HTML file, changing browser, updating by moving to a new path, or changing computers.** Import that backup with **Restore backup**. A backup contains your private writing and files, so store it somewhere appropriate.

Attachments support PNG, JPEG, WebP, GIF, PDF, and UTF-8 text (`txt`, `md`, `csv`, `json`): 5 MB per file, 20 MB total, 200 attachments. The app explains other workspace limits if reached. These bounds keep complete backups portable. Existing records take priority when merging backups; duplicate IDs are skipped and word totals use the higher count. Active timers from backups are skipped.

Running timers retain their scheduled end time while the app is closed and are settled on reopening. Pause before stepping away if you do not want that time credited. Changes to the computer clock can affect time accounting. Counts and understanding badges record your own assessment, not a qualification or a measurement of vocabulary mastery.

## Your study islands

Each island represents one subject. Study hours raise its level; achievements add trees and a glowing tower, up to 12 achievements of scenery. Display an earned reward from Collection to add an ornament. Select an island for a close-up, use Whole world for the overview, or turn on Calm mode. The guide below the scene explains the progression. Levels reflect time invested, not a qualification.

## Languages

Amharic, Arabic, Bengali, Catalan, Chinese (Cantonese), Chinese (Mandarin), Czech, Danish, Dutch, English, Filipino, Finnish, French, German, Greek, Gujarati, Hausa, Hebrew, Hindi, Hungarian, Indonesian, Irish, Italian, Japanese, Korean, Latin, Malay, Marathi, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Sanskrit, Serbian, Spanish, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh, Yoruba, and Zulu.

A note beneath the language dropdown points to Assistant for optional AI-generated lessons for the selected language. Each language has independent vocabulary counts, hour rewards, reviews, practice prompts, and personal topic notes. The app helps organize learning; it does not ship complete language courses. Choose the dialect, script, or variety appropriate to your own materials.

## Optional AI setup

Read the [API key setup and removal guide](API-KEY-GUIDE.md) for saving a key, using an optional local JSON key file, removing a key from macOS Keychain or Windows Credential Manager, revoking an exposed key, and removing Atlas from your computer. A copy is included in the download ZIP as Markdown and plain text.

Tracking and built-in lessons work offline. To use AI, enable **Study Assistant** in Settings, choose a provider and an API model your account can use, and enter its API key in the app. A ChatGPT or Claude chat subscription does not replace an API account. Provider usage may incur charges. Model availability changes; the model field is editable.

By default, typed keys stay in memory for the current tab and are cleared by refresh, clearing the field, or disabling AI. When Atlas runs through the local companion, you can optionally choose **Remember on this computer** and **Save key locally**. This stores a separate key for each provider in macOS Keychain or Windows Credential Manager. Saved keys survive reopening Atlas and stay separate from the HTML, GitHub source, progress database, and Atlas backups. The companion uses saved keys without returning them to the browser. A typed key takes priority. Disabling AI keeps a saved key; **Forget saved key** removes it and clears the selected provider’s temporary key. Your selected lesson messages, learning aim, language preferences, and subject time/count summary are sent to your chosen provider. Unrelated journal entries and attachments are excluded. Provider retention policies still apply. Keep credentials out of lesson notes. Browser-held keys can be read by extensions with access to that tab.

Direct browser connections depend on provider and browser support. If a request is blocked, use the **local companion**:

1. Install Node.js 22 or newer from [nodejs.org](https://nodejs.org/).
2. Extract the companion package, keeping `atlas-study-world.html`, `companion.mjs`, `credential-vault.mjs`, `key-file.mjs`, `windows-credential-helper.ps1`, and the launcher in the same folder.
3. Run `Start Atlas on Mac.command` on macOS or `Start Atlas on Windows.cmd` on Windows, or run `node companion.mjs` in that folder.
4. Open `http://127.0.0.1:5175`, then select **Local companion on this computer** in Assistant settings.
5. Restore a progress backup when moving from the downloaded file or hosted app to this browser address. They use different browser storage.

The companion runs on this computer, listens only on the loopback address, and makes provider requests on your behalf. It uses the temporary key entered for that request or your explicitly selected saved-key source. Keys are never logged or included in progress exports. Saving an OS credential and allowing a local key file are separate Settings actions. Its API rejects other website origins and forwards only to the three fixed provider endpoints. Close the terminal to stop it. Core tracking and included lessons still work offline while using this launcher; AI requires internet.

### Optional local API-key file

In companion Settings, enable **Allow local key-file access** and select **Local API-key file** as the key source. Click **Create empty template**; this creates a file only if one does not already exist. Open it in a plain-text editor and fill only the provider values you use. Leave the temporary API-key field empty to use the file source.

The default location is `~/Library/Application Support/Atlas Study World/api-keys.json` on Mac and `%APPDATA%\Atlas Study World\api-keys.json` on Windows. The included [api-keys.example.json](api-keys.example.json) has empty values for `openai`, `claude`, and `deepseek`. Keys must be quoted strings in valid UTF-8 JSON; keep the `.json` extension rather than `.json.txt`.

This file contains readable plaintext. Prefer the OS credential store for protection. Atlas reads the selected provider’s key without returning it to the browser; the file stays separate from the HTML, progress database, and progress backups. Never upload a filled file to GitHub, add it to a source ZIP, or attach it to an issue. The default filename is ignored by Git, but renamed files and manually created archives can still expose a key. Your computer backups may include it.

**Clear selected key from file** empties that provider’s entry while keeping the others. Disabling file access stops Atlas from using the file and leaves it on disk. Clear the provider entries or delete the file before removing Atlas if you want those local copies gone. These actions do not revoke the keys in their provider accounts. See the [full setup and removal instructions](API-KEY-GUIDE.md#optional-local-api-key-file).

### Remove a saved key

In Atlas, open **Settings**, choose the AI provider, and click **Forget saved key**. This deletes that provider’s saved OS credential. **Clear key from this tab** only clears the temporary input.

You can also remove the credential through your operating system:

- **Mac:** Open **Keychain Access**, select your login keychain, and search for `org.atlas-study-world.api-keys.v1` or `Atlas Study World`. Select the matching provider’s password item and choose Delete. Delete only the matching item.
- **Windows:** Open **Credential Manager** → **Windows Credentials** → **Generic Credentials**. Expand `org.atlas-study-world.api-keys.v1/deepseek` (or `/openai`, `/claude`) and select Remove.

Removing the local copy does not revoke the provider’s API key. To stop that key from working everywhere, revoke it in the provider’s account. OS credential stores protect saved data, but other programs running as your user may have access; OS backups and migrations can include credential-store data. Atlas does not include it in its own exports. Managed computers may block credential-store helpers; Atlas reports an error; check its saved-key status before retrying. Keys used for persistent storage must be printable ASCII, as standard provider keys are.

[Apple Keychain Access guide](https://support.apple.com/guide/keychain-access/welcome/mac) · [Microsoft Credential Manager guide](https://support.microsoft.com/en-us/windows/security/credential-manager-in-windows)

Listening uses installed browser/system voices. Atlas reads a tagged listening script when the assistant supplies one; otherwise it reads the displayed message. Matching voices must be installed for the selected language, and may not work offline on every system. A language without an installed voice can still use text lessons. The app reports missing voices. Classical-language levels are a difficulty guide, not CEFR certification.

[OpenAI API overview](https://developers.openai.com/api/reference/overview) · [Claude Messages API](https://platform.claude.com/docs/en/api/messages/create) · [DeepSeek Chat API](https://api-docs.deepseek.com/api/create-chat-completion/)

## Compatibility and checks

The same HTML download targets macOS and Windows; no separate installer is needed. Chrome and Edge are the intended browsers. Local-file database support depends on browser settings; Atlas shows a storage error if it cannot save.

Development checks cover timer caps and pause accounting, concurrent database writes and rollback, separate language counts, all 50 languages at 50,000 words, full backup round-trips with attachments, custom subjects, goal horizons, Unicode journals, valid Word exports, and escaped printable reports. Checks also cover all 96 lessons, correct-answer completion, conversation save conflicts, lesson-owned timers, repeated completion, API request/response shapes, key-free backups, the companion’s origin and size limits, saved-key provider isolation, cross-origin credential access rejection, and save/forget error handling. A separate dummy-key macOS Keychain integration check passed saving, replacement, reading, and deletion; its test entry was removed. Windows credential behavior is implemented and tested with mock helpers, but has not been run on a Windows computer. The settings interface passed save, reopen, and forget checks using a disposable test store.

A real DeepSeek Spanish lesson, follow-up response, and lesson completion were verified through the local companion. Its saved conversation persisted after reopening, and completion earned two rewards without adding study time when its timer was off. OpenAI and Claude provider calls remain checked with mock responses. The browser UI was checked through a local HTTP preview. Automated browser tools in this environment block `file:` navigation; direct file-opening and Windows behavior have not been independently verified here. Please report browser/OS details with issues.

PDF export uses the browser’s print dialog: choose **Save as PDF**. Word export creates an actual `.docx` file. Printer page size and margins can be adjusted in the print dialog.

## Build from source

Requires Node.js 22 or newer and npm. Internet is needed to install build dependencies once.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The finished single file is `dist/atlas-study-world.html`. `npm run preview` opens a local HTTP preview at `http://127.0.0.1:5174` for development. The source is separate from the original hosted Atlas app. To launch the companion from source, copy `dist/atlas-study-world.html` to `companion/atlas-study-world.html`, then run the launcher in `companion/`. Optional companion checks run with `node --test companion/companion.test.mjs companion/credential-vault.test.mjs companion/key-file.test.mjs` (mock provider requests; native OS integration is opt-in).

## Privacy and project notes

No app accounts, analytics, cloud sync, or runtime CDN downloads. AI is optional and makes requests only after you enable a provider and ask for a lesson. The Content Security Policy allows only the three supported API hosts and the optional local companion. External references open only when chosen by the user. Third-party notices are included in `THIRD_PARTY_NOTICES.txt`.

This public repository provides source and downloads. Public visibility does not grant an additional license to the app’s original code. Third-party components retain their own licenses.

Background: [IndexedDB offline storage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology) · [Browser storage persistence](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API).
