import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {createCredentialVault} from './credential-vault.mjs';
import {createKeyFileStore} from './key-file.mjs';

export const REQUEST_LIMIT=500*1024;
export const RESPONSE_LIMIT=1024*1024;
const ENDPOINTS=Object.freeze({openai:'https://api.openai.com/v1/responses',claude:'https://api.anthropic.com/v1/messages',deepseek:'https://api.deepseek.com/chat/completions'});
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(value,keys)=>object(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
const invalid=()=>{throw new Error('Invalid request.');};
const validProvider=provider=>typeof provider==='string'&&Object.hasOwn(ENDPOINTS,provider);
const validateKey=value=>{if(typeof value!=='string')invalid();const key=value.trim();if(!/^[^\s\x00-\x1f\x7f]{6,1000}$/.test(key))invalid();return key};

export function validateCredentialPayload(payload){
 if(!object(payload)||!validProvider(payload.provider))invalid();
 if(payload.action==='status'||payload.action==='forget'){
  if(!exact(payload,['action','provider']))invalid();
  return {action:payload.action,provider:payload.provider};
 }
 if(payload.action==='save'&&exact(payload,['action','provider','key']))return {action:'save',provider:payload.provider,key:validateKey(payload.key)};
 invalid();
}

export function validateKeyFilePayload(payload){
 if(!exact(payload,['action','provider','allowKeyFile'])||payload.allowKeyFile!==true||!validProvider(payload.provider)||!['status','create-template','clear'].includes(payload.action))invalid();
 return {action:payload.action,provider:payload.provider,allowKeyFile:true};
}

export function validatePayload(payload){
 const saved=exact(payload,['provider','useSavedKey','body'])&&payload.useSavedKey===true;
 const file=exact(payload,['provider','useKeyFile','allowKeyFile','body'])&&payload.useKeyFile===true&&payload.allowKeyFile===true;
 if((!exact(payload,['provider','key','body'])&&!saved&&!file)||!validProvider(payload.provider))invalid();
 const {provider,body}=payload;
 const key=saved||file?undefined:validateKey(payload.key);
 const shape=provider==='openai'?['model','instructions','input','store','max_output_tokens']:provider==='claude'?['model','system','messages','max_tokens']:['model','messages','stream','max_tokens','thinking'];
 if(!exact(body,shape)||typeof body.model!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(body.model))invalid();
 const tokenLimit=provider==='openai'?body.max_output_tokens:body.max_tokens;
 if(!Number.isInteger(tokenLimit)||tokenLimit<1||tokenLimit>2400)invalid();
 if(provider==='openai'&&(body.store!==false||!text(body.instructions,16000)))invalid();
 if(provider==='claude'&&!text(body.system,16000))invalid();
 if(provider==='deepseek'&&(body.stream!==false||!exact(body.thinking,['type'])||body.thinking.type!=='disabled'))invalid();
 const messages=provider==='openai'?body.input:body.messages;
 if(!Array.isArray(messages)||messages.length<1||messages.length>(provider==='deepseek'?25:24))invalid();
 let total=(body.instructions??body.system??'').length;
 for(let i=0;i<messages.length;i++){
  const message=messages[i];
  if(!exact(message,['role','content'])||!text(message.content,16000))invalid();
  if(message.role!=='user'&&message.role!=='assistant'&&!(provider==='deepseek'&&i===0&&message.role==='system'))invalid();
  total+=message.content.length;
 }
 if(total>196000||!messages.some(m=>m.role==='user')||messages.at(-1).role!=='user')invalid();
 return file?{provider,useKeyFile:true,allowKeyFile:true,body}:saved?{provider,useSavedKey:true,body}:{provider,key,body};
}

async function readRequest(req){
 const declared=req.headers['content-length'];
 if(declared!==undefined&&(!/^\d+$/.test(declared)||Number(declared)>REQUEST_LIMIT))throw Object.assign(new Error('Request too large.'),{status:413});
 return new Promise((resolve,reject)=>{
  let size=0;const chunks=[];
  const cleanup=()=>{req.off('data',onData);req.off('end',onEnd);req.off('error',onError);req.off('aborted',onAbort)};
  const fail=error=>{cleanup();req.resume();reject(error)};
  const onData=chunk=>{size+=chunk.length;if(size>REQUEST_LIMIT){fail(Object.assign(new Error('Request too large.'),{status:413}));return}chunks.push(chunk)};
  const onEnd=()=>{cleanup();resolve(Buffer.concat(chunks).toString('utf8'))};
  const onError=()=>fail(new Error('Invalid request.'));
  const onAbort=()=>fail(new Error('Invalid request.'));
  req.on('data',onData);req.once('end',onEnd);req.once('error',onError);req.once('aborted',onAbort);
 });
}

async function readResponse(response){
 if(!response.body)throw new Error('Unavailable.');
 const length=response.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>RESPONSE_LIMIT)){await response.body.cancel();throw new Error('Unavailable.')}
 const reader=response.body.getReader();const chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>RESPONSE_LIMIT)throw new Error('Unavailable.');chunks.push(value)}return JSON.parse(Buffer.concat(chunks.map(v=>Buffer.from(v))).toString('utf8'))}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
}

function safeResponse(provider,value,key){
 if(!object(value)||value.error)throw new Error('Unavailable.');
 let pieces;
 if(provider==='openai')pieces=Array.isArray(value.output)?value.output.filter(v=>object(v)&&v.type==='message'&&Array.isArray(v.content)).flatMap(v=>v.content).filter(v=>object(v)&&v.type==='output_text').map(v=>v.text):[];
 else if(provider==='claude')pieces=Array.isArray(value.content)?value.content.filter(v=>object(v)&&v.type==='text').map(v=>v.text):[];
 else pieces=[value.choices?.[0]?.message?.content];
 if(!pieces.length||pieces.some(v=>typeof v!=='string')||!pieces.join('').trim())throw new Error('Unavailable.');
 const content=pieces.join('\n').replaceAll(key,'[API key removed]');
 if(provider==='openai')return {output:[{type:'message',content:[{type:'output_text',text:content}]}]};
 if(provider==='claude')return {content:[{type:'text',text:content}]};
 return {choices:[{message:{role:'assistant',content}}]};
}

const send=(res,status,message)=>{if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(typeof message==='string'?{error:message}:message))};

export function createHandler({fetcher=fetch,vault=createCredentialVault(),keyFile=createKeyFileStore(),host='127.0.0.1:5175',htmlPath=path.join(path.dirname(fileURLToPath(import.meta.url)),'atlas-study-world.html'),readHtml=()=>readFile(htmlPath),timeoutMs=90000}={}){
 const origin=`http://${host}`;
 return async function handler(req,res){
  try{
   if(req.headers.host!==host){send(res,403,'Request denied.');req.resume();return}
   if(req.url==='/'||req.url==='/atlas-study-world.html'){
    if(req.method!=='GET'||(req.headers.origin&&req.headers.origin!==origin)){send(res,403,'Request denied.');req.resume();return}
    let html;try{html=await readHtml()}catch{send(res,404,'Place atlas-study-world.html beside the companion.');return}
    if(res.destroyed)return;
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});res.end(html);return;
   }
   if(req.url!=='/api/assistant'&&req.url!=='/api/credentials'&&req.url!=='/api/key-file'){send(res,404,'Not found.');req.resume();return}
   if(req.method!=='POST'){send(res,405,'Use POST.');req.resume();return}
   if(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site'){send(res,403,'Request denied.');req.resume();return}
   if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']??'')||req.headers['content-encoding']){send(res,415,'Use JSON.');req.resume();return}
   let payload;
   try{const raw=JSON.parse(await readRequest(req));payload=req.url==='/api/credentials'?validateCredentialPayload(raw):req.url==='/api/key-file'?validateKeyFilePayload(raw):validatePayload(raw)}catch(error){send(res,error.status===413?413:400,error.status===413?'Request too large.':'Invalid request.');return}
   if(req.url==='/api/key-file'){
    try{if(payload.action==='create-template')await keyFile.createTemplate();else if(payload.action==='clear')await keyFile.clear(payload.provider);send(res,200,await keyFile.info(payload.provider));}
    catch{send(res,503,'The local key file could not be accessed. Check its format, location, and permissions.');}return;
   }
   if(req.url==='/api/credentials'){
    const {action,provider}=payload;
    const supported=vault.supported===true;const storeName=typeof vault.storeName==='string'?vault.storeName:'Unavailable';
    if(!supported){send(res,action==='status'?200:503,action==='status'?{supported:false,storeName,saved:false}:'Secure key storage is unavailable on this computer.');return}
    try{
     if(action==='save')await vault.save(provider,payload.key);
     else if(action==='forget')await vault.forget(provider);
     const saved=action==='status'?await vault.status(provider):action==='save';
     send(res,200,{supported:true,storeName,saved:saved===true});
    }catch{send(res,503,'Secure key storage could not complete this request. Check that the credential store is unlocked and try again.')}
    return;
   }
   const {provider,body}=payload;let key=payload.key;
   if(payload.useSavedKey){
    if(vault.supported!==true){send(res,503,'Secure key storage is unavailable on this computer.');return}
    try{key=await vault.load(provider);if(key===null||key===undefined||key===''){send(res,400,'No saved key. Open Settings to save a key or enter one for this session.');return}key=validateKey(key)}
    catch{send(res,503,'Secure key storage could not complete this request. Check that the credential store is unlocked and try again.');return}
   }
   if(payload.useKeyFile){
    try{key=validateKey(await keyFile.load(provider));}catch{send(res,400,'No valid key is available in the local API-key file. Check Settings and the file.');return;}
   }
   if(res.destroyed||res.writableEnded)return;
   const headers={'Content-Type':'application/json'};
   if(provider==='claude')Object.assign(headers,{'x-api-key':key,'anthropic-version':'2023-06-01'});else headers.Authorization=`Bearer ${key}`;
   const controller=new AbortController();const abort=()=>controller.abort();const timer=setTimeout(abort,timeoutMs);timer.unref?.();res.once('close',abort);
   try{
    const response=await fetcher(ENDPOINTS[provider],{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:controller.signal,credentials:'omit'});
    if(!response.ok){await response.body?.cancel().catch(()=>{});const status=[401,403,429].includes(response.status)?response.status:502;send(res,status,'The provider could not complete this request.');return}
    const result=safeResponse(provider,await readResponse(response),key);if(Buffer.byteLength(JSON.stringify(result),'utf8')>RESPONSE_LIMIT)throw new Error('Unavailable.');send(res,200,result);
   }catch{send(res,502,'The provider could not complete this request.')}
   finally{clearTimeout(timer);res.off('close',abort)}
  }catch{send(res,500,'The companion could not complete this request.')}
 };
}

export function startCompanion(){
 if(Number(process.versions.node.split('.')[0])<22){console.error('The Atlas companion requires Node.js 22 or newer.');process.exitCode=1;return}
 const server=http.createServer(createHandler());server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxHeadersCount=100;
 server.on('error',()=>{console.error('The Atlas companion could not start. Check whether port 5175 is already in use.');process.exitCode=1});
 server.listen(5175,'127.0.0.1',()=>console.log('Atlas is ready at http://127.0.0.1:5175. Keep this window open.'));
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)startCompanion();
