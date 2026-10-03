# Atlas Study World Offline — Study Tracker, Pomodoro Timer & Goal Planner

**Download one HTML file and build your study world offline.** Atlas combines a 3D study tracker, Pomodoro timer, goal planner, weekly progress reports, and a personal study journal. It is designed for desktop browsers on **macOS and Windows**, with automatic local saving and no login or subscription.

[**Download Atlas HTML**](https://github.com/AuroraX98/atlas-study-world-offline/releases/latest/download/atlas-study-world.html) · [Latest release](https://github.com/AuroraX98/atlas-study-world-offline/releases/latest)

## Start studying

1. Download `atlas-study-world.html` from the latest release.
2. Keep it in a permanent folder and open it in Chrome or Edge using a normal browser window.
3. Choose a subject or language, add a goal, and start a focus session.
4. Use **Export progress** regularly to save a full backup, including attachments and journal entries.

The app includes all its JavaScript, styles, and 3D graphics. Tracking works without a network connection or local server. Reference websites and manually using ChatGPT require internet access.

## What you can track

- **Study and learning:** Math, Physics, Quantum Physics, Coding, AI, Art, and 50 language choices. Add your own subjects and personal learning milestones.
- **Focus and achievements:** Pomodoro study time credited automatically to the selected subject; pauses and breaks excluded; hour levels, topic badges, practice, review, goal, and vocabulary achievements. Display rewards on immersive 3D islands or use calm mode.
- **Language vocabulary:** Separate word counts and reviews for each language; 243 reachable vocabulary milestones through 50,000 words. After 100 words, the next milestones are 150, 200, 250, 300, and 350. Counts are self-reported; entering the actual words is optional and not required.
- **Goals and weekly progress:** Quests with steps and time invested; a goal board for this week, this month, six months, one year, and five years; weekly study charts and accomplishment reports. Download printable HTML posters or choose **Print / Save PDF**.
- **Journal and study materials:** Autosaving journal entries with prompts for events, challenges, lessons, goals, and vision. Export one entry or the complete journal as Word `.docx`, Markdown, text, or through **Print / Save PDF**. Keep topic notes, study questions, and local attachments together. Copy a study prompt into ChatGPT yourself when desired.

## Where your data lives

Your progress and attachment copies are stored in an **IndexedDB database in your browser profile on this computer**. They are not embedded in the downloaded HTML file and are not uploaded to GitHub or a server. Automatic saving confirms completed database transactions. A short-lived typing draft is also kept locally to recover unfinished writing.

Use the same file location, browser, and browser profile for everyday use. Avoid private/incognito windows for a lasting workspace. Browser storage can be removed when browser data is cleared. **Export a backup before moving the HTML file, changing browser, updating by moving to a new path, or changing computers.** Import that backup with **Restore backup**. A backup contains your private writing and files, so store it somewhere appropriate.

Attachments support PNG, JPEG, WebP, GIF, PDF, and UTF-8 text (`txt`, `md`, `csv`, `json`): 5 MB per file, 20 MB total, 200 attachments. The app explains other workspace limits if reached. These bounds keep complete backups portable. Existing records take priority when merging backups; duplicate IDs are skipped and word totals use the higher count. Active timers from backups are skipped.

Running timers retain their scheduled end time while the app is closed and are settled on reopening. Pause before stepping away if you do not want that time credited. Changes to the computer clock can affect time accounting. Counts and understanding badges record your own assessment, not a qualification or a measurement of vocabulary mastery.

## Languages

Amharic, Arabic, Bengali, Catalan, Chinese (Cantonese), Chinese (Mandarin), Czech, Danish, Dutch, English, Filipino, Finnish, French, German, Greek, Gujarati, Hausa, Hebrew, Hindi, Hungarian, Indonesian, Irish, Italian, Japanese, Korean, Latin, Malay, Marathi, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Sanskrit, Serbian, Spanish, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh, Yoruba, and Zulu.

Each language has independent vocabulary counts, hour rewards, reviews, practice prompts, and personal topic notes. The app helps organize learning; it does not ship complete language courses. Choose the dialect, script, or variety appropriate to your own materials.

## Compatibility and checks

The same HTML download targets macOS and Windows; no separate installer is needed. Chrome and Edge are the intended browsers. Local-file database support depends on browser settings; Atlas shows a storage error if it cannot save.

Development checks cover timer caps and pause accounting, concurrent database writes and rollback, separate language counts, all 50 languages at 50,000 words, full backup round-trips with attachments, custom subjects, goal horizons, Unicode journals, valid Word exports, and escaped printable reports. The browser UI was checked through a local HTTP preview. Automated browser tools in this environment block `file:` navigation; direct file-opening and Windows behavior have not been independently verified here. Please report browser/OS details with issues.

PDF export uses the browser’s print dialog: choose **Save as PDF**. Word export creates an actual `.docx` file. Printer page size and margins can be adjusted in the print dialog.

## Build from source

Requires Node.js 22 or newer and npm. Internet is needed to install build dependencies once.

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The finished single file is `dist/atlas-study-world.html`. `npm run preview` opens a local HTTP preview at `http://127.0.0.1:5174` for development. The source is separate from the original hosted Atlas app.

## Privacy and project notes

No accounts, analytics, cloud sync, AI API calls, or runtime CDN downloads. The shipped file blocks network connections through its Content Security Policy. External references open only when chosen by the user. Third-party notices are included in `THIRD_PARTY_NOTICES.txt`.

This public repository provides source and downloads. Public visibility does not grant an additional license to the app’s original code. Third-party components retain their own licenses.

Background: [IndexedDB offline storage](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology) · [Browser storage persistence](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API).
