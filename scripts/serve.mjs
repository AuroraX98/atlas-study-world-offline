import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const port=Number(process.env.ATLAS_PORT??5174);
createServer(async(req,res)=>{try{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile('dist/atlas-study-world.html'))}catch{res.writeHead(404);res.end('Build Atlas first.')}}).listen(port,'127.0.0.1',()=>console.log(`Atlas local preview http://127.0.0.1:${port}`));
