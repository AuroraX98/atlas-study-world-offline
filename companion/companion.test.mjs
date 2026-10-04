import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {EventEmitter} from 'node:events';
import {validatePayload,validateCredentialPayload,validateKeyFilePayload,createHandler,REQUEST_LIMIT,RESPONSE_LIMIT} from './companion.mjs';

const fakeKey='TEST_ONLY_NOT_A_REAL_KEY';
const bodies={openai:{model:'test-openai',instructions:'Tutor politely.',input:[{role:'user',content:'Explain fractions.'}],store:false,max_output_tokens:2400},claude:{model:'test-claude',system:'Tutor politely.',messages:[{role:'user',content:'Explain fractions.'}],max_tokens:2400},deepseek:{model:'test-deepseek',messages:[{role:'system',content:'Tutor politely.'},{role:'user',content:'Explain fractions.'}],stream:false,max_tokens:2400,thinking:{type:'disabled'}}};
const payload=provider=>({provider,key:fakeKey,body:structuredClone(bodies[provider])});
const vendor=provider=>provider==='openai'?{output:[{type:'reasoning'},{type:'message',content:[{type:'output_text',text:'One half.'}]}]}:provider==='claude'?{content:[{type:'text',text:'One half.'}]}:{choices:[{message:{content:'One half.'}}]};
class MockResponse extends EventEmitter{destroyed=false;writableEnded=false;statusCode=0;headers={};body='';writeHead(status,headers){this.statusCode=status;this.headers=headers;return this}end(value=''){this.body=String(value);this.writableEnded=true}}
async function invoke({provider='openai',raw,headers={},method='POST',url='/api/assistant',fetcher,readHtml,timeoutMs,vault,keyFile}={}){
 const req=Readable.from([Buffer.from(raw??JSON.stringify(payload(provider)))]);req.headers={host:'127.0.0.1:5175',origin:'http://127.0.0.1:5175','content-type':'application/json',...headers};req.method=method;req.url=url;
 const res=new MockResponse();let calls=[];
 const handler=createHandler({fetcher:fetcher??(async(endpoint,options)=>{calls.push({endpoint,options});return Response.json(vendor(provider))}),vault,keyFile,readHtml:readHtml??(async()=>Buffer.from('<!doctype html><title>Atlas</title>')),timeoutMs});
 await handler(req,res);return {res,calls};
}

test('three providers accept only their bounded documented request shapes',()=>{for(const provider of Object.keys(bodies)){assert.equal(validatePayload(payload(provider)).provider,provider)}});
test('reject malformed providers, keys, models and extra fields',()=>{
 const candidates=[null,{}, {...payload('openai'),provider:['openai']},{...payload('openai'),provider:'other'},{...payload('openai'),key:'abc'},{...payload('openai'),key:'abc\nlong'},{...payload('openai'),url:'https://example.com'}];
 for(const bad of candidates)assert.throws(()=>validatePayload(bad));
 for(const provider of Object.keys(bodies)){for(const change of [{model:''},{model:'https://example.com'},{extra:true}])assert.throws(()=>validatePayload({...payload(provider),body:{...bodies[provider],...change}}))}
});
test('reject excessive tokens, messages, content, roles, totals and unsafe flags',()=>{
 for(const provider of Object.keys(bodies)){
  const field=provider==='openai'?'max_output_tokens':'max_tokens';const mf=provider==='openai'?'input':'messages';
  for(const value of [0,2401,1.5,'2400']){const p=payload(provider);p.body[field]=value;assert.throws(()=>validatePayload(p))}
  for(const messages of [[],Array.from({length:26},()=>({role:'user',content:'a'})),[{role:'developer',content:'a'}],[{role:'user',content:'a',url:'https://example.com'}],[{role:'user',content:'a'.repeat(16001)}],[{role:'assistant',content:'a'}],Array.from({length:24},()=>({role:'user',content:'a'.repeat(16000)}))]){const p=payload(provider);p.body[mf]=messages;assert.throws(()=>validatePayload(p))}
 }
 for(const [provider,change]of [['openai',{store:true}],['claude',{system:{role:'system'}}],['deepseek',{stream:true}],['deepseek',{thinking:{type:'enabled'}}]]){const p=payload(provider);Object.assign(p.body,change);assert.throws(()=>validatePayload(p))}
});
test('mock-only provider routing, authorization and redirect prevention',async()=>{
 const endpoints={openai:'https://api.openai.com/v1/responses',claude:'https://api.anthropic.com/v1/messages',deepseek:'https://api.deepseek.com/chat/completions'};
 for(const provider of Object.keys(bodies)){
  const {res,calls}=await invoke({provider});assert.equal(res.statusCode,200);assert.match(res.body,/One half/);assert.equal(calls.length,1);assert.equal(calls[0].endpoint,endpoints[provider]);assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.credentials,'omit');assert.deepEqual(JSON.parse(calls[0].options.body),bodies[provider]);
  if(provider==='claude'){assert.equal(calls[0].options.headers['x-api-key'],fakeKey);assert.equal(calls[0].options.headers['anthropic-version'],'2023-06-01');assert.equal(calls[0].options.headers.Authorization,undefined)}else assert.equal(calls[0].options.headers.Authorization,`Bearer ${fakeKey}`);
  assert.ok(!res.body.includes(fakeKey));assert.equal(res.headers['Cache-Control'],'no-store');
 }
});
test('deny missing/cross origin, host mismatch, cross-site fetches and non-JSON',async()=>{
 for(const [headers,status]of [[{origin:undefined},403],[{origin:'null'},403],[{origin:'https://example.com'},403],[{host:'localhost:5175'},403],[{host:'evil.example:5175'},403],[{'sec-fetch-site':'cross-site'},403],[{'content-type':'text/plain'},415],[{'content-encoding':'gzip'},415]]){
  const {res,calls}=await invoke({headers});assert.equal(res.statusCode,status);assert.equal(calls.length,0);assert.ok(!res.headers['Access-Control-Allow-Origin']);
 }
});
test('reject malformed JSON and oversized requests without forwarding',async()=>{
 for(const [raw,headers,status]of [['{bad',{},400],[JSON.stringify({...payload('openai'),extra:true}),{},400],['x'.repeat(REQUEST_LIMIT+1),{},413],['{}',{'content-length':String(REQUEST_LIMIT+1)},413]]){const {res,calls}=await invoke({raw,headers});assert.equal(res.statusCode,status);assert.equal(calls.length,0);assert.ok(!res.body.includes(fakeKey))}
});
test('only the standalone HTML is served and API only accepts POST',async()=>{
 const {res,calls}=await invoke({method:'GET',url:'/',headers:{origin:undefined}});assert.equal(res.statusCode,200);assert.match(res.body,/Atlas/);assert.equal(calls.length,0);assert.equal(res.headers['X-Frame-Options'],'DENY');
 for(const url of ['/../companion.mjs','/companion.mjs','/api/assistant?url=https://example.com'])assert.equal((await invoke({url})).res.statusCode,404);
 assert.equal((await invoke({method:'GET'})).res.statusCode,405);
 assert.equal((await invoke({method:'GET',url:'/',readHtml:async()=>{throw Error('private path')}})).res.statusCode,404);
});
test('provider errors, exceptions and malformed output never expose provider details or keys',async()=>{
 for(const status of [401,403,429,500,302]){const {res}=await invoke({fetcher:async()=>Response.json({error:`private-provider-error ${fakeKey}`},{status})});assert.equal(res.statusCode,[401,403,429].includes(status)?status:502);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('private-provider-error'))}
 for(const fetcher of [async()=>{throw Error(`private-provider-error ${fakeKey}`)},async()=>new Response('{bad'),async()=>Response.json({error:fakeKey}),async()=>Response.json({output:[]})]){const {res}=await invoke({fetcher});assert.equal(res.statusCode,502);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('private-provider-error'))}
});
test('only normalized text is returned and echoed keys are removed',async()=>{
 for(const provider of Object.keys(bodies)){
  const body=vendor(provider);body.privateMetadata=fakeKey;
  if(provider==='openai')body.output[1].content[0].text=`Echo ${fakeKey}`;else if(provider==='claude')body.content[0].text=`Echo ${fakeKey}`;else body.choices[0].message.content=`Echo ${fakeKey}`;
  const {res}=await invoke({provider,fetcher:async()=>Response.json(body)});assert.equal(res.statusCode,200);assert.match(res.body,/API key removed/);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('privateMetadata'));
 }
});
test('bound upstream responses both with and without content-length',async()=>{
 for(const headers of [{},{'content-length':String(RESPONSE_LIMIT+1)}]){const {res}=await invoke({fetcher:async()=>new Response('x'.repeat(RESPONSE_LIMIT+1),{headers})});assert.equal(res.statusCode,502)}
});
test('timeout aborts the injected request and returns a generic error',async()=>{
 const {res}=await invoke({timeoutMs:5,fetcher:async(_url,{signal})=>new Promise((_resolve,reject)=>{signal.addEventListener('abort',()=>reject(Error(fakeKey)),{once:true})})});assert.equal(res.statusCode,502);assert.ok(!res.body.includes(fakeKey));
});
test('also bound the normalized result after redaction expands short key echoes',async()=>{
 const key='ABCDEF';const p=payload('openai');p.key=key;
 const {res}=await invoke({raw:JSON.stringify(p),fetcher:async()=>Response.json({output:[{type:'message',content:[{type:'output_text',text:key.repeat(150000)}]}]})});assert.equal(res.statusCode,502);assert.ok(!res.body.includes(key));assert.ok(Buffer.byteLength(res.body)<RESPONSE_LIMIT);
});

function memoryVault({supported=true,failure=false}={}){
 const values=new Map();const accesses=[];
 const run=(action,provider)=>{accesses.push({action,provider});if(failure)throw Error(`PRIVATE_VAULT_FAILURE ${fakeKey}`)};
 return {supported,storeName:'Test credential store',accesses,values,
  async status(provider){run('status',provider);return values.has(provider)},
  async save(provider,key){run('save',provider);values.set(provider,key)},
  async load(provider){run('load',provider);return values.get(provider)??null},
  async forget(provider){run('forget',provider);values.delete(provider)}};
}
const credential=(action,provider='deepseek',key=fakeKey)=>JSON.stringify(action==='save'?{action,provider,key}:{action,provider});
const savedPayload=provider=>({provider,useSavedKey:true,body:structuredClone(bodies[provider])});

test('credentials have strict provider-specific action schemas and no arbitrary store fields',()=>{
 for(const action of ['status','save','forget'])assert.equal(validateCredentialPayload(JSON.parse(credential(action))).action,action);
 for(const bad of [null,{}, {action:'load',provider:'deepseek'}, {action:'status',provider:'other'}, {action:'status',provider:'deepseek',key:fakeKey}, {action:'forget',provider:'deepseek',service:'other-account'}, {action:'save',provider:'deepseek',key:'abc'}, {action:'save',provider:'deepseek',key:'abc\ndef'}, {action:'save',provider:'deepseek',key:fakeKey,path:'/tmp/key'}, {action:'save',provider:'deepseek'}])assert.throws(()=>validateCredentialPayload(bad));
});
test('saved-key assistant requests are exclusive, explicit and keep bounded provider bodies',()=>{
 for(const provider of Object.keys(bodies))assert.deepEqual(validatePayload(savedPayload(provider)),savedPayload(provider));
 for(const bad of [{...savedPayload('deepseek'),key:fakeKey}, {...savedPayload('deepseek'),useSavedKey:false}, {...savedPayload('deepseek'),useSavedKey:1}, {...savedPayload('deepseek'),provider:'other'}, {...savedPayload('deepseek'),extra:true}, {...savedPayload('deepseek'),body:{...bodies.deepseek,max_tokens:2401}}])assert.throws(()=>validatePayload(bad));
});
test('credential guard checks reject unsafe callers before any vault access',async()=>{
 for(const [changes,status]of [[{headers:{origin:undefined}},403],[{headers:{origin:'null'}},403],[{headers:{origin:'https://atlas.example'}},403],[{headers:{host:'evil.example:5175'}},403],[{headers:{'sec-fetch-site':'cross-site'}},403],[{headers:{'content-type':'text/plain'}},415],[{headers:{'content-encoding':'gzip'}},415],[{method:'GET'},405],[{url:'/api/credentials?provider=deepseek'},404]]){
  const vault=memoryVault();const {res,calls}=await invoke({vault,url:'/api/credentials',raw:credential('save'),...changes});assert.equal(res.statusCode,status);assert.equal(vault.accesses.length,0);assert.equal(calls.length,0);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.headers['Access-Control-Allow-Origin']);
 }
 for(const raw of ['{bad',JSON.stringify({action:'save',provider:'other',key:fakeKey}),'x'.repeat(REQUEST_LIMIT+1)]){
  const vault=memoryVault();const {res}=await invoke({vault,url:'/api/credentials',raw});assert.equal(res.statusCode,raw.length>REQUEST_LIMIT?413:400);assert.equal(vault.accesses.length,0);
 }
 const vault=memoryVault();vault.values.set('deepseek',fakeKey);const {res,calls}=await invoke({vault,raw:JSON.stringify(savedPayload('deepseek')),headers:{origin:'https://atlas.example'}});assert.equal(res.statusCode,403);assert.equal(vault.accesses.length,0);assert.equal(calls.length,0);
});
test('credential save/status/forget isolate providers and never return saved secrets',async()=>{
 const vault=memoryVault();
 for(const [action,provider,expectedSaved]of [['status','deepseek',false],['save','deepseek',true],['status','deepseek',true],['status','claude',false],['save','claude',true],['forget','deepseek',false],['status','claude',true],['forget','deepseek',false]]){
  const {res,calls}=await invoke({vault,url:'/api/credentials',raw:credential(action,provider)});assert.equal(res.statusCode,200);assert.deepEqual(JSON.parse(res.body),{supported:true,storeName:'Test credential store',saved:expectedSaved});assert.equal(calls.length,0);assert.ok(!res.body.includes(fakeKey));assert.equal(res.headers['Cache-Control'],'no-store');
 }
 assert.ok(vault.values.has('claude'));assert.ok(!vault.values.has('deepseek'));assert.ok(vault.accesses.every(v=>v.action!=='load'));
});
test('saved keys stay server-side, reach only the selected provider and are redacted from output',async()=>{
 for(const provider of Object.keys(bodies)){
  const vault=memoryVault();vault.values.set(provider,fakeKey);
  let forwarded;
  const body=vendor(provider);if(provider==='openai')body.output[1].content[0].text=`Echo ${fakeKey}`;else if(provider==='claude')body.content[0].text=`Echo ${fakeKey}`;else body.choices[0].message.content=`Echo ${fakeKey}`;
  const {res}=await invoke({provider,vault,raw:JSON.stringify(savedPayload(provider)),fetcher:async(endpoint,options)=>{forwarded={endpoint,options};return Response.json(body)}});
  assert.equal(res.statusCode,200);assert.match(res.body,/API key removed/);assert.ok(!res.body.includes(fakeKey));assert.deepEqual(vault.accesses,[{action:'load',provider}]);assert.deepEqual(JSON.parse(forwarded.options.body),bodies[provider]);assert.ok(!forwarded.options.body.includes(fakeKey));assert.equal(provider==='claude'?forwarded.options.headers['x-api-key']:forwarded.options.headers.Authorization,provider==='claude'?fakeKey:`Bearer ${fakeKey}`);
 }
});
test('missing, unsupported, or locked vaults return generic errors without forwarding',async()=>{
 const absent=memoryVault();let result=await invoke({vault:absent,raw:JSON.stringify(savedPayload('deepseek'))});assert.equal(result.res.statusCode,400);assert.match(result.res.body,/No saved key/);assert.equal(result.calls.length,0);
 const unsupported=memoryVault({supported:false});result=await invoke({vault:unsupported,url:'/api/credentials',raw:credential('status')});assert.equal(result.res.statusCode,200);assert.deepEqual(JSON.parse(result.res.body),{supported:false,storeName:'Test credential store',saved:false});assert.equal(unsupported.accesses.length,0);
 for(const request of [{url:'/api/credentials',raw:credential('save')},{url:'/api/credentials',raw:credential('forget')},{raw:JSON.stringify(savedPayload('deepseek'))}]){
  result=await invoke({vault:unsupported,...request});assert.equal(result.res.statusCode,503);assert.equal(result.calls.length,0);assert.equal(unsupported.accesses.length,0);
 }
 for(const request of [{url:'/api/credentials',raw:credential('status')},{url:'/api/credentials',raw:credential('save')},{url:'/api/credentials',raw:credential('forget')},{raw:JSON.stringify(savedPayload('deepseek'))}]){
  result=await invoke({vault:memoryVault({failure:true}),...request});assert.equal(result.res.statusCode,503);assert.equal(result.calls.length,0);assert.ok(!result.res.body.includes(fakeKey));assert.ok(!result.res.body.includes('PRIVATE_VAULT_FAILURE'));
 }
});

function memoryKeyFile({failure=false,fileExists=true}={}){
 const values=new Map(),accesses=[],filePath='/TEST_ONLY/api-keys.json';let exists=fileExists;
 const run=(action,provider)=>{accesses.push({action,provider});if(failure)throw Error(`PRIVATE_FILE_FAILURE ${fakeKey} ${filePath}`)};
 return {filePath,values,accesses,
  async info(provider){run('info',provider);return {supported:true,storeName:'Local API-key file',saved:values.has(provider),fileExists:exists,filePath}},
  async createTemplate(){run('create-template');const created=!exists;exists=true;return {created,filePath}},
  async clear(provider){run('clear',provider);values.delete(provider)},
  async load(provider){run('load',provider);if(!values.has(provider))throw Error(`MISSING_FILE_KEY ${fakeKey}`);return values.get(provider)}};
}
const filePayload=provider=>({provider,useKeyFile:true,allowKeyFile:true,body:structuredClone(bodies[provider])});
const fileAction=(action,provider='deepseek')=>({action,provider,allowKeyFile:true});

test('local key-file schemas require explicit permission and forbid arbitrary paths or mixed key sources',()=>{
 for(const action of ['status','create-template','clear'])assert.deepEqual(validateKeyFilePayload(fileAction(action)),fileAction(action));
 for(const provider of Object.keys(bodies))assert.deepEqual(validatePayload(filePayload(provider)),filePayload(provider));
 for(const bad of [null,{}, {action:'load',provider:'deepseek',allowKeyFile:true}, {...fileAction('status'),provider:'other'}, {action:'status',provider:'deepseek'}, {...fileAction('status'),allowKeyFile:false}, {...fileAction('status'),allowKeyFile:1}, {...fileAction('clear'),filePath:'/other/key.json'}, {...fileAction('create-template'),path:'/other/key.json'}, {...fileAction('status'),key:fakeKey}])assert.throws(()=>validateKeyFilePayload(bad));
 for(const bad of [{provider:'deepseek',useKeyFile:true,body:bodies.deepseek}, {...filePayload('deepseek'),allowKeyFile:false}, {...filePayload('deepseek'),allowKeyFile:'true'}, {...filePayload('deepseek'),useKeyFile:false}, {...filePayload('deepseek'),key:fakeKey}, {...filePayload('deepseek'),useSavedKey:true}, {...filePayload('deepseek'),filePath:'/other/key.json'}, {...filePayload('deepseek'),provider:'other'}, {...filePayload('deepseek'),body:{...bodies.deepseek,max_tokens:2401}}])assert.throws(()=>validatePayload(bad));
});

test('unsafe callers and unapproved key-file requests are denied before any file or vault access',async()=>{
 for(const [changes,status]of [[{headers:{origin:undefined}},403],[{headers:{origin:'null'}},403],[{headers:{origin:'https://atlas.example'}},403],[{headers:{host:'evil.example:5175'}},403],[{headers:{'sec-fetch-site':'cross-site'}},403],[{headers:{'content-type':'text/plain'}},415],[{headers:{'content-encoding':'gzip'}},415],[{method:'GET'},405],[{url:'/api/key-file?path=/other/key.json'},404]]){
  const keyFile=memoryKeyFile(),vault=memoryVault();const {res,calls}=await invoke({keyFile,vault,url:'/api/key-file',raw:JSON.stringify(fileAction('status')),...changes});assert.equal(res.statusCode,status);assert.equal(keyFile.accesses.length,0);assert.equal(vault.accesses.length,0);assert.equal(calls.length,0);assert.ok(!res.headers['Access-Control-Allow-Origin']);
 }
 for(const request of [
  {url:'/api/key-file',raw:JSON.stringify({action:'status',provider:'deepseek'})},
  {url:'/api/key-file',raw:JSON.stringify({...fileAction('status'),allowKeyFile:false})},
  {url:'/api/key-file',raw:JSON.stringify({...fileAction('clear'),filePath:'/other/key.json'})},
  {raw:JSON.stringify({provider:'deepseek',useKeyFile:true,body:bodies.deepseek})},
  {raw:JSON.stringify({...filePayload('deepseek'),key:fakeKey})},
  {raw:JSON.stringify({...filePayload('deepseek'),useSavedKey:true})},
  {raw:JSON.stringify({...filePayload('deepseek'),filePath:'/other/key.json'})}
 ]){const keyFile=memoryKeyFile(),vault=memoryVault();const {res,calls}=await invoke({keyFile,vault,...request});assert.equal(res.statusCode,400);assert.equal(keyFile.accesses.length,0);assert.equal(vault.accesses.length,0);assert.equal(calls.length,0);assert.ok(!res.body.includes(fakeKey));}
 const keyFile=memoryKeyFile(),vault=memoryVault();const {res,calls}=await invoke({keyFile,vault,raw:JSON.stringify(filePayload('deepseek')),headers:{origin:'https://atlas.example'}});assert.equal(res.statusCode,403);assert.equal(keyFile.accesses.length,0);assert.equal(vault.accesses.length,0);assert.equal(calls.length,0);
});

test('key-file status, template and clear expose only metadata and preserve other providers',async()=>{
 const keyFile=memoryKeyFile({fileExists:false}),vault=memoryVault();
 for(const [action,provider,expectedSaved,expectedExists]of [['status','deepseek',false,false],['create-template','deepseek',false,true]]){
  const {res,calls}=await invoke({keyFile,vault,url:'/api/key-file',raw:JSON.stringify(fileAction(action,provider))});assert.equal(res.statusCode,200);assert.deepEqual(JSON.parse(res.body),{supported:true,storeName:'Local API-key file',saved:expectedSaved,fileExists:expectedExists,filePath:keyFile.filePath});assert.equal(calls.length,0);assert.equal(res.headers['Cache-Control'],'no-store');
 }
 keyFile.values.set('deepseek',fakeKey);keyFile.values.set('claude','TEST_OTHER_PROVIDER_KEY');
 for(const [action,provider,expectedSaved]of [['status','deepseek',true],['create-template','deepseek',true],['clear','deepseek',false],['status','claude',true]]){
  const {res,calls}=await invoke({keyFile,vault,url:'/api/key-file',raw:JSON.stringify(fileAction(action,provider))});assert.equal(res.statusCode,200);assert.deepEqual(JSON.parse(res.body),{supported:true,storeName:'Local API-key file',saved:expectedSaved,fileExists:true,filePath:keyFile.filePath});assert.equal(calls.length,0);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('TEST_OTHER_PROVIDER_KEY'));
 }
 assert.equal(keyFile.values.get('claude'),'TEST_OTHER_PROVIDER_KEY');assert.equal(keyFile.values.has('deepseek'),false);assert.equal(vault.accesses.length,0);assert.ok(keyFile.accesses.every(access=>access.action!=='load'));
});

test('file-held keys reach only the selected provider, bypass the vault, and redact echoed secrets',async()=>{
 const endpoints={openai:'https://api.openai.com/v1/responses',claude:'https://api.anthropic.com/v1/messages',deepseek:'https://api.deepseek.com/chat/completions'};
 for(const provider of Object.keys(bodies)){
  const keyFile=memoryKeyFile(),vault=memoryVault();for(const p of Object.keys(bodies))keyFile.values.set(p,`TEST_FILE_KEY_${p}`);
  const key=keyFile.values.get(provider),body=vendor(provider);let forwarded;
  if(provider==='openai')body.output[1].content[0].text=`Echo ${key}`;else if(provider==='claude')body.content[0].text=`Echo ${key}`;else body.choices[0].message.content=`Echo ${key}`;
  const {res}=await invoke({provider,keyFile,vault,raw:JSON.stringify(filePayload(provider)),fetcher:async(endpoint,options)=>{forwarded={endpoint,options};return Response.json(body)}});
  assert.equal(res.statusCode,200);assert.match(res.body,/API key removed/);assert.ok(!res.body.includes(key));assert.deepEqual(keyFile.accesses,[{action:'load',provider}]);assert.equal(vault.accesses.length,0);assert.equal(forwarded.endpoint,endpoints[provider]);assert.deepEqual(JSON.parse(forwarded.options.body),bodies[provider]);assert.ok(!forwarded.options.body.includes(key));assert.equal(provider==='claude'?forwarded.options.headers['x-api-key']:forwarded.options.headers.Authorization,provider==='claude'?key:`Bearer ${key}`);assert.equal(forwarded.options.redirect,'error');assert.equal(forwarded.options.credentials,'omit');
 }
});

test('missing, malformed, and invalid file keys return generic errors without forwarding or fallback',async()=>{
 for(const keyFile of [memoryKeyFile({fileExists:false}),memoryKeyFile({failure:true})]){
  if(keyFile.accesses&&keyFile.values&&!keyFile.values.size)keyFile.values.set('claude',fakeKey);
  const vault=memoryVault();vault.values.set('deepseek',fakeKey);const {res,calls}=await invoke({keyFile,vault,raw:JSON.stringify(filePayload('deepseek'))});assert.equal(res.statusCode,400);assert.equal(calls.length,0);assert.equal(vault.accesses.length,0);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('PRIVATE_FILE_FAILURE'));assert.ok(!res.body.includes('MISSING_FILE_KEY'));assert.ok(!res.body.includes(keyFile.filePath));
 }
 const invalid=memoryKeyFile();invalid.values.set('deepseek','abc');const {res,calls}=await invoke({keyFile:invalid,raw:JSON.stringify(filePayload('deepseek'))});assert.equal(res.statusCode,400);assert.equal(calls.length,0);
 for(const action of ['status','create-template','clear']){const keyFile=memoryKeyFile({failure:true}),vault=memoryVault();const {res,calls}=await invoke({keyFile,vault,url:'/api/key-file',raw:JSON.stringify(fileAction(action))});assert.equal(res.statusCode,503);assert.equal(calls.length,0);assert.equal(vault.accesses.length,0);assert.ok(!res.body.includes(fakeKey));assert.ok(!res.body.includes('PRIVATE_FILE_FAILURE'));assert.ok(!res.body.includes(keyFile.filePath));}
});
