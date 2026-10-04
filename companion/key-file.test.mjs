import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,lstat,readdir,symlink,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createKeyFileStore} from './key-file.mjs';

async function fixture(t){const directory=await mkdtemp(path.join(tmpdir(),'atlas-key-file-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));const filePath=path.join(directory,'private','api-keys.json');return {directory,filePath,store:createKeyFileStore({filePath})};}
const keys={openai:'dummy-openai-key',claude:'dummy-claude-key',deepseek:'dummy-deepseek-key'};

test('missing file reports metadata only and template creates once with restrictive permissions',async t=>{
 const {filePath,store}=await fixture(t);
 assert.deepEqual(await store.info('deepseek'),{supported:true,storeName:'Local API-key file',saved:false,fileExists:false,filePath});
 assert.deepEqual(await store.createTemplate(),{created:true,filePath});
 assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),{openai:'',claude:'',deepseek:''});
 if(process.platform!=='win32'){assert.equal((await lstat(filePath)).mode&0o777,0o600);assert.equal((await lstat(path.dirname(filePath))).mode&0o777,0o700)}
 await writeFile(filePath,JSON.stringify(keys));
 const before=await readFile(filePath,'utf8');
 assert.deepEqual(await store.createTemplate(),{created:false,filePath});assert.equal(await readFile(filePath,'utf8'),before);
 const info=await store.info('deepseek');assert.equal(info.saved,true);assert.equal(JSON.stringify(info).includes(keys.deepseek),false);
 assert.equal(await store.load('deepseek'),keys.deepseek);
});

test('clear removes only the selected provider and serializes concurrent clears',async t=>{
 const {filePath,store}=await fixture(t);await store.createTemplate();await writeFile(filePath,JSON.stringify(keys));
 const result=await store.clear('deepseek');assert.equal(result.saved,false);assert.equal(result.fileExists,true);assert.equal(JSON.stringify(result).includes(keys.openai),false);
 assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),{...keys,deepseek:''});
 await Promise.all([store.clear('openai'),store.clear('claude')]);
 assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),{openai:'',claude:'',deepseek:''});
 assert.deepEqual(await readdir(path.dirname(filePath)),['api-keys.json']);
 if(process.platform!=='win32')assert.equal((await lstat(filePath)).mode&0o777,0o600);
});

test('missing or blank key has a generic error and clear does not create a missing file',async t=>{
 const {filePath,store}=await fixture(t);await assert.rejects(store.load('deepseek'),/No API key is saved/);
 assert.equal((await store.clear('deepseek')).fileExists,false);await assert.rejects(lstat(filePath),{code:'ENOENT'});
 await store.createTemplate();await assert.rejects(store.load('deepseek'),/No API key is saved/);
});

test('loading trims entered keys while clearing preserves other fields exactly',async t=>{
 const {filePath,store}=await fixture(t);await store.createTemplate();
 const entered={openai:'  dummy-openai-key  ',claude:'   ',deepseek:'dummy-deepseek-key'};await writeFile(filePath,JSON.stringify(entered));
 assert.equal(await store.load('openai'),keys.openai);assert.equal((await store.info('claude')).saved,false);await assert.rejects(store.load('claude'),/No API key is saved/);
 await store.clear('deepseek');assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),{...entered,deepseek:''});
 await store.clear('claude');assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),{...entered,deepseek:'',claude:''});
});

test('malformed, oversized, extra-field and invalid-key files fail without overwriting or exposing contents',async t=>{
 const {filePath,store}=await fixture(t);await store.createTemplate();
 for(const value of ['not-json-secret-value','x'.repeat(32769),JSON.stringify({...keys,unexpected:'secret-extra'}),JSON.stringify({...keys,deepseek:123}),JSON.stringify({...keys,deepseek:'secret with spaces'}),JSON.stringify({...keys,deepseek:'x'.repeat(1001)}),'[]','null',JSON.stringify({deepseek:keys.deepseek})]){
  await writeFile(filePath,value);
  for(const attempt of [()=>store.info('deepseek'),()=>store.load('deepseek'),()=>store.clear('deepseek'),()=>store.createTemplate()])await assert.rejects(attempt(),error=>{assert.equal(error.message.includes(value),false);assert.equal(error.message.includes(keys.openai),false);return /could not be read or updated/.test(error.message)});
  assert.equal(await readFile(filePath,'utf8'),value);
 }
});

test('symbolic links and nonregular files are rejected without changing their targets',async t=>{
 const {directory,filePath,store}=await fixture(t);await mkdir(path.dirname(filePath),{recursive:true});const target=path.join(directory,'target.json');await writeFile(target,JSON.stringify(keys));
 try{await symlink(target,filePath)}catch(error){if(process.platform==='win32'&&error.code==='EPERM'){t.skip('Windows symlink creation needs extra privileges.');return}throw error}
 for(const attempt of [()=>store.info('deepseek'),()=>store.load('deepseek'),()=>store.clear('deepseek'),()=>store.createTemplate()])await assert.rejects(attempt(),/could not be read or updated/);
 assert.deepEqual(JSON.parse(await readFile(target,'utf8')),keys);
 await rm(filePath);await mkdir(filePath);await assert.rejects(store.info('deepseek'),/could not be read or updated/);await assert.rejects(store.createTemplate(),/could not be read or updated/);
});

test('unsupported providers and relative paths cannot select arbitrary entries',async t=>{
 const {store}=await fixture(t);await assert.rejects(store.info('../other'),/supported API provider/);await assert.rejects(store.load('__proto__'),/supported API provider/);assert.throws(()=>store.clear('other'),/supported API provider/);assert.throws(()=>createKeyFileStore({filePath:'api-keys.json'}),/could not be read or updated/);
});
