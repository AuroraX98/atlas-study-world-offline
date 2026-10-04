import test from 'node:test';
import assert from 'node:assert/strict';
import { createCredentialVault, credentialService, runCredentialProcess } from './credential-vault.mjs';

const login = '"/Users/example/Library/Keychains/login.keychain-db"\n';
const ok = (stdout = '') => ({ code: 0, stdout, stderr: '' });
const absent = { code: 44, stdout: '', stderr: 'not found' };

test('macOS saves one quoted stdin command without a key in process arguments', async () => {
  const calls = [];
  const key = 'dummy-\\"$`;-key';
  const vault = createCredentialVault({ platform: 'darwin', runner: async (...args) => { calls.push(args); return args[1][0] === 'login-keychain' ? ok(login) : args[1][0] === 'find-generic-password' ? absent : ok(); } });
  await vault.save('deepseek', key);
  assert.equal(vault.storeName, 'macOS Keychain');
  assert.equal(calls.length, 3);
  const [command, args, input] = calls[2];
  assert.equal(command, '/usr/bin/security');
  assert.deepEqual(args, ['-i', '-q']);
  assert.equal(JSON.stringify(args).includes(key), false);
  assert.equal(input.split('\n').length, 2);
  assert.equal(input.includes('dummy-\\\\\\"$`;-key'), true);
  assert.equal(input.includes('"-A"'), false);
  assert.equal(input.includes('"-v"'), false);
  assert.equal(input.includes('"-T" "/usr/bin/security"'), true);
  assert.equal(input.includes(`"${credentialService}"`), true);
});

test('macOS updates the password without rewriting existing access controls', async () => {
  const calls = [];
  const vault = createCredentialVault({ platform: 'darwin', runner: async (...args) => { calls.push(args); return args[1][0] === 'login-keychain' ? ok(login) : ok(); } });
  await vault.save('deepseek', 'dummy-replacement-key');
  assert.equal(calls[2][2].includes('"-T"'), false);
  assert.equal(calls[2][2].includes('"-U"'), true);
});

test('macOS status does not request password output and missing operations are idempotent', async () => {
  const calls = [];
  const vault = createCredentialVault({ platform: 'darwin', runner: async (...args) => {
    calls.push(args); return args[1][0] === 'login-keychain' ? ok(login) : absent;
  } });
  assert.equal(await vault.status('claude'), false);
  assert.equal(calls[1][1].includes('-w'), false);
  assert.equal(await vault.load('claude'), null);
  assert.equal(calls[2][1].includes('-w'), true);
  await vault.forget('claude');
  assert.equal(calls[3][1][0], 'delete-generic-password');
  assert.equal(calls[3][1].includes('-a'), true);
  assert.equal(calls[3][1].includes('claude'), true);
});

test('macOS load returns RAM-only key and errors discard stderr or raw helper failures', async () => {
  const key = 'dummy-local-key';
  const vault = createCredentialVault({ platform: 'darwin', runner: async (_, args) => args[0] === 'login-keychain' ? ok(login) : ok(`${key}\n`) });
  assert.equal((await vault.load('openai')) === key, true);
  const failing = createCredentialVault({ platform: 'darwin', runner: async (_, args) => args[0] === 'login-keychain' ? ok(login) : { code: 1, stdout: key, stderr: key } });
  await assert.rejects(failing.save('openai', key), error => !error.message.includes(key) && !error.cause);
  const throwing = createCredentialVault({ platform: 'darwin', runner: async () => { throw new Error(key); } });
  await assert.rejects(throwing.status('openai'), error => !error.message.includes(key) && !error.cause);
});

test('provider, namespace, key characters, and command byte bounds fail closed', async () => {
  let calls = 0;
  const runner = async () => { calls++; return ok(login); };
  const vault = createCredentialVault({ platform: 'darwin', runner });
  assert.throws(() => vault.status('../../other-secret'), /provider/);
  for (const value of ['', 'tiny', 'dummy\nkey', 'dummy key', 'dummy\0key', 'x'.repeat(1001), 'dummy-ékey'])
    assert.throws(() => vault.save('deepseek', value), /valid API key/);
  assert.equal(calls, 0);
  assert.throws(() => createCredentialVault({ service: 'bad\ncommand' }), /namespace/);
  const unavailable = createCredentialVault({ platform: 'linux', runner });
  assert.equal(unavailable.supported, false);
  assert.equal(unavailable.storeName, 'Unavailable');
  await assert.rejects(unavailable.status('openai'), /macOS or Windows/);
});

test('Windows helper code is constant; key JSON travels through stdin and status is metadata only', async () => {
  const calls = [];
  const key = 'dummy-Windows-key';
  const vault = createCredentialVault({ platform: 'win32', runner: async (...args) => {
    calls.push(args); const input = JSON.parse(args[2]);
    if (input.operation === 'status') return ok('{"ok":true,"saved":true}');
    if (input.operation === 'load') return ok(JSON.stringify({ ok: true, key }));
    return ok('{"ok":true}');
  } });
  await vault.save('deepseek', key);
  assert.equal(vault.storeName, 'Windows Credential Manager');
  assert.equal(await vault.status('deepseek'), true);
  assert.equal((await vault.load('deepseek')) === key, true);
  await vault.forget('deepseek');
  const [command, args, input] = calls[0];
  assert.equal(command.endsWith('WindowsPowerShell\\v1.0\\powershell.exe'), true);
  assert.equal(args.includes('-ExecutionPolicy'), false);
  assert.equal(args.includes('-EncodedCommand'), true);
  assert.equal(JSON.stringify(args).includes(key), false);
  assert.equal(JSON.parse(input).key === key, true);
  assert.equal('key' in JSON.parse(calls[1][2]), false);
  const code = Buffer.from(args.at(-1), 'base64').toString('utf16le');
  assert.equal(code.includes('value.Persist = 2;'), true);
  assert.equal(code.includes('CredFree'), true);
  assert.equal(code.includes('CredentialBlobSize > 1000'), true);
  assert.equal(code.includes('Marshal.FreeHGlobal(blob)'), true);
});

test('Windows helper failures and invalid stored key output never expose response contents', async () => {
  for (const result of [{ code: 1, stdout: 'dummy-sensitive-error', stderr: 'dummy-sensitive-error' }, ok('{"ok":false}'), ok('{"ok":true,"key":"dummy\\nkey"}')]) {
    const vault = createCredentialVault({ platform: 'win32', runner: async () => result });
    await assert.rejects(vault.load('deepseek'), error => !error.message.includes('dummy') && !error.cause);
  }
});

test('credential process runner does not attach input or child error details to errors', async () => {
  await assert.rejects(runCredentialProcess('/no/such/atlas-vault-helper', [], 'dummy-stdin-key'), error => !error.message.includes('dummy') && !error.cause);
});

test('provider operations serialize and a failed operation does not block the next one', async () => {
  const operations = [];
  let release, entered;
  const started = new Promise(resolve => { entered = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  const vault = createCredentialVault({ platform: 'win32', runner: async (_, args, input) => {
    const request = JSON.parse(input); operations.push(request.operation);
    if (request.operation === 'save') { entered(); await blocked; return { code: 1, stdout: '{"ok":false}', stderr: '' }; }
    return ok('{"ok":true,"saved":false}');
  } });
  const saving = vault.save('deepseek', 'dummy-queued-key');
  const rejected = assert.rejects(saving, /credential store/);
  await started;
  const status = vault.status('deepseek');
  await Promise.resolve();
  assert.deepEqual(operations, ['save']);
  release(); await rejected;
  assert.equal(await status, false);
  assert.deepEqual(operations, ['save', 'status']);
});

test('native macOS vault round-trip uses only an isolated dummy service, including punctuation and update/delete', { skip: process.platform !== 'darwin' || process.env.ATLAS_TEST_NATIVE_VAULT !== '1' }, async () => {
  const service = `org.atlas-study-world.vault-test-${process.pid}`;
  assert.notEqual(service, credentialService);
  const vault = createCredentialVault({ service });
  const key = 'dummy-\\"$`;-native-key';
  const replacement = 'dummy-native-replacement';
  try {
    assert.equal(await vault.status('deepseek'), false);
    await vault.save('deepseek', key);
    assert.equal(await vault.status('deepseek'), true);
    assert.equal((await vault.load('deepseek')) === key, true);
    assert.equal(await vault.status('openai'), false);
    await vault.save('deepseek', replacement);
    assert.equal((await vault.load('deepseek')) === replacement, true);
    await vault.forget('deepseek');
    assert.equal(await vault.status('deepseek'), false);
    assert.equal(await vault.load('deepseek'), null);
    await vault.forget('deepseek');
  } finally { await vault.forget('deepseek'); }
});
