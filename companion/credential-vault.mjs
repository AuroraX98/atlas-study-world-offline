import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { win32 } from 'node:path';

export const credentialService = 'org.atlas-study-world.api-keys.v1';
const providers = new Set(['openai', 'claude', 'deepseek']);
const failure = () => new Error('The computer credential store is unavailable. Unlock it and try again.');
const providerName = provider => {
  if (!providers.has(provider)) throw new Error('Choose a supported AI provider.');
  return provider;
};
const cleanKey = value => {
  if (typeof value !== 'string' || !/^[\x21-\x7e]{6,1000}$/.test(value.trim()))
    throw new Error('Enter a valid API key (6 to 1,000 printable characters, without spaces).');
  return value.trim();
};

// No shell, secrets in arguments, environment variables, files, or error objects.
// stdout is private to the companion; a load response must never reach the browser.
export function runCredentialProcess(command, args, input = '') {
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn(command, args, { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] }); }
    catch { reject(failure()); return; }
    let stdout = '', stderr = '', outputBytes = 0, done = false;
    const finish = (error, value) => {
      if (done) return;
      done = true; clearTimeout(timer);
      if (error) { child.kill(); reject(failure()); } else resolve(value);
    };
    const timer = setTimeout(() => finish(true), 30_000);
    for (const [stream, name] of [[child.stdout, 'stdout'], [child.stderr, 'stderr']]) {
      stream.setEncoding('utf8');
      stream.on('data', chunk => {
        outputBytes += Buffer.byteLength(chunk);
        if (outputBytes > 16_384) { finish(true); return; }
        if (name === 'stdout') stdout += chunk; else stderr += chunk;
      });
    }
    child.on('error', () => finish(true));
    child.stdin.on('error', () => finish(true));
    child.on('close', code => finish(false, { code, stdout, stderr }));
    child.stdin.end(input);
  });
}

// Apple's security interactive parser handles quotes/backslashes itself. It does
// not run a shell or expand $, backticks, semicolons, or other shell syntax.
// One bounded command and one newline retain that command's exit status.
const securityQuote = value => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;

export function createCredentialVault({ platform = process.platform, runner = runCredentialProcess, service = credentialService } = {}) {
  // Only trusted application code/tests choose a namespace; browser requests cannot.
  if (!/^[a-zA-Z0-9._-]{1,120}$/.test(service)) throw new Error('Invalid credential namespace.');
  const supported = platform === 'darwin' || platform === 'win32';
  const storeName = platform === 'darwin' ? 'macOS Keychain' : platform === 'win32' ? 'Windows Credential Manager' : 'Unavailable';
  let loginPathPromise, windowsScriptPromise;
  const pending = new Map();
  const run = async (command, args, input) => {
    try { return await runner(command, args, input); } catch { throw failure(); }
  };
  const loginPath = async () => {
    if (!loginPathPromise) loginPathPromise = (async () => {
      const result = await run('/usr/bin/security', ['login-keychain']);
      const raw = result.stdout.trim();
      const path = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
      if (result.code !== 0 || !/^\/[^\x00-\x1f\x7f]+$/.test(path) || Buffer.byteLength(path) > 1024) throw failure();
      return path;
    })().catch(error => { loginPathPromise = undefined; throw error; });
    return loginPathPromise;
  };
  const mac = async (operation, provider, key) => {
    const keychain = await loginPath();
    const args = ['-s', service, '-a', provider];
    if (operation === 'save') {
      // Explicitly trust Apple's security tool when creating this app's item.
      // Existing items retain their access controls: -T on an update rewrites
      // those controls and requires a separate OS permission prompt.
      const existing = await run('/usr/bin/security', ['find-generic-password', ...args, keychain]);
      if (existing.code !== 0 && existing.code !== 44) throw failure();
      const access = existing.code === 44 ? ['-T', '/usr/bin/security'] : [];
      const words = ['add-generic-password', '-U', ...args, '-l', `Atlas Study World - ${provider} API key`, ...access, '-w', key, keychain];
      const input = words.map(securityQuote).join(' ') + '\n';
      if (Buffer.byteLength(input) > 4094) throw failure();
      const result = await run('/usr/bin/security', ['-i', '-q'], input);
      if (result.code !== 0) throw failure();
      return;
    }
    const command = operation === 'forget' ? 'delete-generic-password' : 'find-generic-password';
    if (operation === 'load') args.push('-w');
    args.push(keychain);
    const result = await run('/usr/bin/security', [command, ...args]);
    if (result.code === 44) return operation === 'status' ? false : operation === 'load' ? null : undefined;
    if (result.code !== 0) throw failure();
    if (operation === 'status') return true;
    if (operation === 'load') {
      try { return cleanKey(result.stdout.replace(/\r?\n$/, '')); } catch { throw failure(); }
    }
  };
  const windows = async (operation, provider, key) => {
    if (!windowsScriptPromise) windowsScriptPromise = readFile(new URL('./windows-credential-helper.ps1', import.meta.url), 'utf8')
      .then(script => Buffer.from(script, 'utf16le').toString('base64'));
    let encoded;
    try { encoded = await windowsScriptPromise; } catch { throw failure(); }
    const root = process.env.SystemRoot || 'C:\\Windows';
    const command = win32.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    // EncodedCommand contains only this public helper code. Key input is JSON stdin.
    // No ExecutionPolicy setting is changed or bypassed; enterprise restrictions fail closed.
    const result = await run(command, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], JSON.stringify({ operation, service, provider, ...(key ? { key } : {}) }));
    let output;
    try { output = JSON.parse(result.stdout.trim()); } catch { throw failure(); }
    if (result.code !== 0 || output?.ok !== true) throw failure();
    if (operation === 'status' && typeof output.saved === 'boolean') return output.saved;
    if (operation === 'load') {
      if (output.key === null) return null;
      try { return cleanKey(output.key); } catch { throw failure(); }
    }
    if ((operation === 'save' || operation === 'forget') && Object.keys(output).length === 1) return;
    throw failure();
  };
  const operate = (operation, provider, key) => {
    providerName(provider);
    if (!supported) return Promise.reject(new Error('Saving API keys requires macOS or Windows.'));
    // Serialize each provider's writes, reads, and deletes within this companion.
    // Two save requests cannot race the create-versus-update access decision.
    const previous = pending.get(provider) || Promise.resolve();
    const task = previous.then(() => platform === 'darwin' ? mac(operation, provider, key) : windows(operation, provider, key));
    const settled = task.then(() => undefined, () => undefined);
    pending.set(provider, settled);
    void settled.then(() => { if (pending.get(provider) === settled) pending.delete(provider); });
    return task;
  };
  return {
    supported, storeName,
    status: provider => operate('status', provider),
    save: (provider, key) => operate('save', provider, cleanKey(key)),
    load: provider => operate('load', provider),
    forget: provider => operate('forget', provider),
  };
}
