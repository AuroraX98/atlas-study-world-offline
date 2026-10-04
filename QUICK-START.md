# Atlas Study World — quick start

Atlas is an offline study tracker with a Pomodoro timer, 3D islands, learning achievements, goals, weekly progress, and a journal. No app login is required. This is a public preview for macOS and Windows; see [VERIFICATION.md](VERIFICATION.md) for completed and remaining checks.

## Open the app

1. Download `atlas-study-world.html` from [the current preview release](https://github.com/AuroraX98/atlas-study-world-offline/releases/tag/v1.1.0-preview.3).
2. Keep it in a permanent folder and open it in Chrome or Edge in a normal browser window.
3. Choose a subject or language, add a goal, and start a focus session. Core tracking and built-in lessons work offline.

Progress is stored in your browser profile on this computer, separately from the HTML. Journal entries autosave as you type; topic notes have a Save note button. Wait for the saved confirmation. If Atlas reports that it cannot save, resolve that error before relying on the app.

## Find what you need

- Open **Subjects**, choose a subject or language, and use its Learning path, Notes, Practice, or Rewards.
- **Today → Continue studying** returns to your last study place. It does not start a new timer.
- **Search** opens exact saved items. Use Cmd+K on Mac or Ctrl+K on Windows; pin a result to keep it on Today.
- **Progress** contains Weekly progress and Study history. **Journal** is for personal writing. **Goals** holds short-term and long-term plans.
- **Settings** separates Study preferences, AI assistant, and Data & backups. Use **Backups → Export progress backup** for a complete saved-data copy.

The app remembers your selected subject, section, filters, and scroll position in this browser. Browser Back and the location trail help you return. Local drafts protect unfinished writing; save weekly reflections and practice records to include them in reports and progress backups. Expand Help finding your way for a short guide.

## Use the optional local companion

Use this option for saved API keys and provider connections that cannot work directly in a browser. It also runs the core app offline through a stable local address.

1. Install Node.js 22 or newer from [nodejs.org](https://nodejs.org/).
2. Download `Atlas-Study-World.zip` from the preview release and extract the entire ZIP into one permanent folder. Keep the HTML, companion files, and launchers together.
3. On Mac, open `Start Atlas on Mac.command`. On Windows, open `Start Atlas on Windows.cmd`. Keep the terminal window open while using Atlas. If the Mac launcher lacks execute permission, open Terminal in the extracted folder and run `node companion.mjs`.
4. Open **http://127.0.0.1:5175/** in Chrome or Edge. Use this same browser address and profile each time.
5. For AI lessons, open **Settings → AI assistant**, enable AI study lessons, choose your provider, expand **Advanced connection settings** for the model and **Local companion on this computer**. Then open **Assistant** to build your lesson.

AI lessons require internet and your own provider API account. API usage may cost money. AI is optional; the core app needs no API key. See [API-KEY-GUIDE.md](API-KEY-GUIDE.md) for temporary keys, protected OS storage, optional plaintext JSON files, and removal or revocation. Only an empty key template is included in the download.

## Keep and move your progress

Use **Backups → Export progress backup** regularly. Use **Restore backup** in that section to import the file. Export before changing browsers, profiles, file location, computer, or app address. The downloaded file, companion address, and hosted app have separate browser storage. Clearing browser data can erase progress. Keep backup files private: they include your writing and attachments.

When updating, export first, stop the companion if running, replace its app/program files with the new download, and keep the same address and browser profile. Your OS credentials and optional key file are stored separately. Do not share a populated key file or place it in a GitHub issue.

## Print or export

Journal entries export as Word `.docx`, Markdown, or text. **Print / Save PDF** opens your browser's print dialog; choose Save as PDF. Weekly progress and goal boards also download as printable HTML posters.

If the companion cannot start because port 5175 is already in use, check whether Atlas is already running and use its existing window, or stop that instance before starting another. Closing its terminal stops the companion.

Full details: [README.md](README.md) · [API key guide](API-KEY-GUIDE.md) · [verification report](VERIFICATION.md).
