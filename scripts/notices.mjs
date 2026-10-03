import {readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const pkg=JSON.parse(await readFile('package.json','utf8')),lock=JSON.parse(await readFile('package-lock.json','utf8'));let out='Atlas Study World Offline — Third-party license notices\n\n';
for(const [folder,meta]of Object.entries(lock.packages)){if(!folder||!folder.startsWith('node_modules/')||meta.dev)continue;try{const p=JSON.parse(await readFile(path.join(folder,'package.json'),'utf8'));out+=`\n=== ${p.name} ${p.version} (${p.license??'see license'}) ===\n`;const names=await readdir(folder),license=names.filter(n=>/^licen[sc]e|^copying|^notice/i.test(n));for(const name of license)try{out+=await readFile(path.join(folder,name),'utf8')+'\n'}catch{}}catch{}}
await writeFile('THIRD_PARTY_NOTICES.txt',out);
