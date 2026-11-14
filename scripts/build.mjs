import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..'), dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
const cmd=process.platform==='win32'?'tsc.cmd':'tsc';
const result=spawnSync(cmd,['--project',resolve(root,'tsconfig.json')],{cwd:root,stdio:'inherit'});
if(result.status!==0){console.error('TypeScript compiler not found or compilation failed. Install deps: npm install');process.exit(result.status||1)}
await cp(resolve(root,'public'),dist,{recursive:true});
await cp(resolve(root,'style.css'),resolve(dist,'style.css'));
await cp(resolve(root,'index.html'),resolve(dist,'index.html'));
const rpc=process.env.NEAR_RPC||'https://rpc.testnet.fastnear.com';
let parsedRpc;
try { parsedRpc=new URL(rpc); }catch{console.error(`Invalid NEAR_RPC value: ${rpc}. Use a plain URL, not Markdown. Example: export NEAR_RPC="https://rpc.testnet.fastnear.com"`);process.exit(1)}
if(!['https:','http:'].includes(parsedRpc.protocol)) {console.error(`Unsupported NEAR_RPC protocol: ${parsedRpc.protocol}`);process.exit(1)}
const cfg={contractId:process.env.CONTRACT_ID||'',network:'testnet',rpc,issueUrl:process.env.GITHUB_ISSUE_URL||''};
await writeFile(resolve(dist,'config.json'),JSON.stringify(cfg,null,2));
console.log('Built dist/ (static HTML + compiled TypeScript; no runtime server required)');
