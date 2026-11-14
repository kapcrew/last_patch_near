import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
const port=Number(process.env.PORT||8080);createServer(async(req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url||'/',`http://${req.headers.host}`).pathname);
 let path=resolve(root,'.'+pathname);if(!path.startsWith(root+sep)&&path!==root){res.writeHead(403);return res.end('Forbidden');}
 try {const s=await stat(path); if(s.isDirectory())path=resolve(path,'index.html');}
 catch{path=resolve(root,'index.html')}
 try{const buf=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-cache'});res.end(buf)}catch{res.writeHead(404);res.end('Not found')}
}).listen(port,'0.0.0.0',()=>console.log(`THE LAST PATCH http://localhost:${port}  (serve dist/)`));
