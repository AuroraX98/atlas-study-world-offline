export const MAX_FILE=5*1024*1024,MAX_STORAGE=20*1024*1024;
export function fileType(bytes:Uint8Array,name:string){
 const prefix=new TextDecoder().decode(bytes.slice(0,16));
 if(bytes[0]===137&&prefix.slice(1,4)==='PNG')return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(prefix.startsWith('GIF87a')||prefix.startsWith('GIF89a'))return 'image/gif';
 if(prefix.startsWith('RIFF')&&prefix.slice(8,12)==='WEBP')return 'image/webp';
 if(prefix.startsWith('%PDF-'))return 'application/pdf';
 if(/\.(txt|md|csv|json)$/i.test(name)){try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(!bytes.includes(0))return 'text/plain'}catch{}}
 throw Error('Choose a PNG, JPEG, WebP, GIF, PDF, or UTF-8 text file.');
}
export function base64(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));return btoa(binary)}
export function fromBase64(value:string){const binary=atob(value);return Uint8Array.from(binary,c=>c.charCodeAt(0))}
