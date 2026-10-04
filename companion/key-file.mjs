import {constants} from 'node:fs';
import {lstat,mkdir,open,rename,unlink} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const PROVIDERS=Object.freeze(['openai','claude','deepseek']);
const LIMIT=32*1024;
const empty=()=>({openai:'',claude:'',deepseek:''});
const failure=()=>new Error('The local API-key file could not be read or updated. Check that it is a regular JSON file with only openai, claude, and deepseek text fields.');
function checkProvider(provider){if(!PROVIDERS.includes(provider))throw new Error('Choose a supported API provider.');}
function defaultPath(){
 const directory=process.platform==='darwin'?path.join(homedir(),'Library','Application Support'):process.platform==='win32'?process.env.APPDATA||path.join(homedir(),'AppData','Roaming'):process.env.XDG_DATA_HOME||path.join(homedir(),'.local','share');
 return path.join(directory,'Atlas Study World','api-keys.json');
}
function validate(raw){
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).length!==PROVIDERS.length)throw failure();
 const result=empty();
 for(const provider of PROVIDERS){
  if(!Object.hasOwn(value,provider)||typeof value[provider]!=='string'||value[provider].length>1000)throw failure();
  const key=value[provider].trim();
  if(key&&!/^[^\s\x00-\x1f\x7f]{6,1000}$/.test(key))throw failure();
  result[provider]=value[provider];
 }
 return result;
}
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs;

// This optional file is plaintext. Its contents remain in companion memory and
// are never returned by info(), included in an error, or written to app backups.
export function createKeyFileStore({filePath=defaultPath()}={}){
 if(typeof filePath!=='string'||!path.isAbsolute(filePath))throw failure();
 const directory=path.dirname(filePath);
 let tail=Promise.resolve();
 const serial=operation=>{const result=tail.then(operation,operation);tail=result.catch(()=>{});return result;};
 const metadata=(provider,record)=>({supported:true,storeName:'Local API-key file',saved:!!record?.keys[provider]?.trim(),fileExists:!!record,filePath});
 async function read(){
  let handle;
  try{
   let initial;try{const parent=await lstat(directory);if(parent.isSymbolicLink()||!parent.isDirectory())throw failure();initial=await lstat(filePath)}catch(error){if(error.code==='ENOENT')return null;throw error}
   if(initial.isSymbolicLink()||!initial.isFile()||initial.size>LIMIT)throw failure();
   handle=await open(filePath,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
   const stat=await handle.stat();
   if(!stat.isFile()||stat.size>LIMIT||!same(initial,stat))throw failure();
   const buffer=Buffer.alloc(LIMIT+1);
   const {bytesRead}=await handle.read(buffer,0,buffer.length,0);
   if(bytesRead>LIMIT||!same(stat,await handle.stat())||!same(stat,await lstat(filePath)))throw failure();
   return {keys:validate(buffer.subarray(0,bytesRead)),stat};
  }catch{throw failure()}finally{await handle?.close().catch(()=>{})}
 }
 async function prepareDirectory(){
  await mkdir(directory,{recursive:true,mode:0o700});
  const stat=await lstat(directory);
  if(stat.isSymbolicLink()||!stat.isDirectory())throw failure();
 }
 return {
  filePath,
  async info(provider){checkProvider(provider);return metadata(provider,await read());},
  async load(provider){checkProvider(provider);const record=await read();if(!record?.keys[provider]?.trim())throw new Error('No API key is saved in the local API-key file for this provider.');return record.keys[provider].trim();},
  createTemplate(){return serial(async()=>{
   let handle,created=false;
   try{
    await prepareDirectory();
    try{handle=await open(filePath,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);created=true}
    catch(error){if(error.code!=='EEXIST')throw error;if(!await read())throw failure();return {created:false,filePath}}
    await handle.writeFile(JSON.stringify(empty(),null,2)+'\n');await handle.sync();
    return {created:true,filePath};
   }catch{await handle?.close().catch(()=>{});handle=null;if(created)await unlink(filePath).catch(()=>{});throw failure()}finally{await handle?.close().catch(()=>{})}
  });},
  clear(provider){checkProvider(provider);return serial(async()=>{
   let temp,handle;
   try{
    const record=await read();if(!record)return metadata(provider,null);
    if(record.keys[provider]==='')return metadata(provider,record);
    await prepareDirectory();
    temp=path.join(directory,`.api-keys-${randomUUID()}.tmp`);
    handle=await open(temp,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|(constants.O_NOFOLLOW??0),0o600);
    const keys={...record.keys,[provider]:''};
    await handle.writeFile(JSON.stringify(keys,null,2)+'\n');await handle.sync();await handle.close();handle=null;
    const current=await lstat(filePath);
    if(current.isSymbolicLink()||!current.isFile()||!same(record.stat,current))throw failure();
    await rename(temp,filePath);temp=null;
    return metadata(provider,{keys});
   }catch{throw failure()}finally{await handle?.close().catch(()=>{});if(temp)await unlink(temp).catch(()=>{})}
  });}
 };
}
