# Atlas Study World: API key setup and removal

The AI study assistant is optional. Atlas tracking and built-in lessons work offline without an API key. AI lessons need internet and an API account with DeepSeek, OpenAI, or Claude. Your provider may charge for API usage. A chat subscription does not automatically include API access.

## Start the local companion

1. Install Node.js 22 or newer from [nodejs.org](https://nodejs.org/).
2. Extract the download ZIP. Keep the HTML, companion files, and launchers together.
3. Open **Start Atlas on Mac.command** on Mac or **Start Atlas on Windows.cmd** on Windows. Keep its terminal window open.
4. Open **http://127.0.0.1:5175/** in your browser.
5. Open **Settings → AI assistant**, enable AI study lessons, and choose your provider. Open **Advanced connection settings** to choose the model and **Local companion on this computer** connection.

You can open the HTML directly for offline tracking. Using a saved OS credential or the optional local API-key file requires the local companion. If moving from another Atlas address or the downloaded HTML, export and restore your progress backup; browser storage is separate for each address.

## Save your key on this computer

1. Enter the selected provider’s API key in **API key for this tab**.
2. Check **Remember on this computer**.
3. Click **Save key locally**. If your computer asks for credential-store access, review the prompt.
4. Wait for the saved confirmation. The field becomes empty; this is expected.

Mac stores the key in your login Keychain. Windows stores it in Credential Manager for your Windows user on this computer. Atlas keeps saved keys separate for each provider. Reopening Atlas uses the saved key when the field is empty and the Local companion connection is selected. Entering a temporary key overrides the saved key for that tab. Use **Replace saved key** to save a replacement.

Atlas does not put saved keys in its HTML, GitHub source, progress database, or progress exports. The companion reads a saved key internally and sends it to your selected provider to authenticate a lesson request. It does not return the saved key to the browser. Other programs running as your computer user may have access to the credential store, and OS backups or migration can include its data.

## Optional local API-key file

You can also keep keys in a JSON file on this computer. This option is off by default and requires explicit permission in Settings. The file contains readable plaintext. Prefer macOS Keychain or Windows Credential Manager when you want the operating system to protect the saved key.

The default file is:

- **Mac:** `~/Library/Application Support/Atlas Study World/api-keys.json`
- **Windows:** `%APPDATA%\Atlas Study World\api-keys.json`

To set it up:

1. Start the companion, open Settings → AI assistant → Advanced connection settings, and choose **Local companion on this computer**.
2. Expand **Optional local API-key file**, then check **Allow local key-file access**, then choose **Local API-key file** as the key source.
3. Click **Create empty template**. It creates the file only if one does not already exist; it will not overwrite your existing keys.
4. Open that file in a plain-text editor. Put your provider key between the empty quotes beside its provider name, then save the file.
5. Choose that provider in Atlas. Leave **API key for this tab** empty so the companion uses the selected file source.

The included `api-keys.example.json` contains only this empty template:

```json
{
  "openai": "",
  "claude": "",
  "deepseek": ""
}
```

Keep the quotation marks around provider names and keys. Use straight double quotes, keep the commas shown above, and save as UTF-8 JSON. A rich-text document or a file named `api-keys.json.txt` will not work. On Windows, choose **All files** when saving in Notepad so it keeps the `.json` extension. On Mac, use a plain-text editor or TextEdit’s **Make Plain Text** option.

**Clear selected key from file** empties only the currently selected provider’s entry and preserves other provider keys. You can also manually replace that provider’s value with `""`. Turning off **Allow local key-file access** stops Atlas from using the file; it does not delete the file or revoke its keys. Deleting Atlas also leaves this file in your computer’s application-data folder unless you remove it yourself.

Never upload a filled key file to GitHub, include it in a source archive, or attach it to an issue. Atlas excludes key-file contents from progress exports and its database. The default filename is ignored by Git in this source repository, but a renamed file or a manually assembled ZIP still needs care. Your own computer backups may include it. The companion reads the selected provider’s key internally without returning it to the browser.

## Clear, forget, or revoke a key

| Action | What it does |
| --- | --- |
| **Clear key from this tab** | Clears the temporary key in the current tab. The saved OS key remains. |
| Refresh or close the tab | Clears that tab’s temporary key. The saved OS key remains. |
| Disable AI study lessons | Stops new AI requests and clears temporary keys in that tab. Saved OS keys remain. |
| **Forget saved key** | Deletes the selected provider’s saved OS key and clears its temporary key in the current tab. |
| **Clear selected key from file** | Clears the selected provider’s JSON entry and preserves other provider keys. |
| Disable **Allow local key-file access** | Stops file-based key use. The file and its contents remain on your computer. |
| Revoke the key in your provider’s account | Makes the key stop working wherever it is used. |

To remove a saved key in Atlas, open **Settings → AI assistant**, choose its provider, and click **Forget saved key**. Other open Atlas tabs may still hold a temporary copy: clear their fields or close those tabs too.

### Remove it manually on Mac

Open **Keychain Access**, select your **login** keychain, and search **Atlas Study World** or `org.atlas-study-world.api-keys.v1`. Select the matching provider’s password item, such as **Atlas Study World - deepseek API key**, and choose **Delete**. Confirm the item’s provider before deleting it. Delete only that item, not your entire keychain.

### Remove it manually on Windows

Open **Credential Manager → Windows Credentials → Generic Credentials**. Expand the matching entry and select **Remove**:

- DeepSeek: `org.atlas-study-world.api-keys.v1/deepseek`
- OpenAI: `org.atlas-study-world.api-keys.v1/openai`
- Claude: `org.atlas-study-world.api-keys.v1/claude`

[Apple Keychain Access guide](https://support.apple.com/guide/keychain-access/welcome/mac) · [Microsoft Credential Manager guide](https://support.microsoft.com/en-us/windows/security/credential-manager-in-windows)

## If you lose a key, expose it, or remove Atlas

You can reuse the same provider key; clearing or forgetting it in Atlas does not cancel it. If you no longer have a copy, follow your provider’s instructions to create a replacement. Do not paste keys into study notes, GitHub issues, screenshots, or source files.

If a key has been exposed, revoke it in your provider’s account, create a replacement, and save that replacement in Atlas. Removing the local copy alone does not prevent someone else from using an exposed key.

Before removing Atlas from your computer, use **Forget saved key** for each provider you saved and clear or delete any optional `api-keys.json` file you created. Deleting the Atlas folder, browser data, or the HTML file does not delete the OS credential or the application-data key file. Stopping the companion also leaves saved keys in place. You can use the manual removal steps even after deleting Atlas.

If saving fails, check that the companion is running and your credential store is unlocked. Check the saved-key status in Settings before retrying. Atlas does not automatically switch to a plaintext key file: file access and its key source must be selected explicitly. A managed computer may restrict credential-store access. Mac saving, replacement, and removal passed isolated dummy-key testing. Windows support has mock checks but still needs testing on an actual Windows computer.

A real DeepSeek Spanish lesson, a follow-up response, and lesson completion were verified through the local companion. The saved lesson survived reopening; completion earned two rewards and added no study time when its timer was off. OpenAI and Claude were checked with mock responses. Direct HTML-file opening and Windows behavior remain unverified in this development environment.
