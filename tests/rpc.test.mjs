import test from 'node:test';import assert from 'node:assert/strict';import{getBounties,view}from '../dist/js/chain/rpc.js';
const cfg={network:'testnet',contractId:'patches.example.testnet',rpc:'https://rpc.testnet.fastnear.com',issueUrl:''};
const bounty={id:1,task_key:'a'.repeat(64),repo:'example/router',issue_number:1,title:'Broken bridge',building_id:'bridge',maintainer:'a.testnet',worker:null,state:'OPEN',reward_yocto:'50000000000000000000000',storage_reserve_yocto:'80000000000000000000000'};
const fakeRpc=content=>({ok:true,async json(){return {result:{result:Array.from(new TextEncoder().encode(JSON.stringify(content)))}}}});
test('rpc view parses JSON and paginated bounties with exact string amounts',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async(_url,opts)=>{const method=JSON.parse(opts.body).params.method_name;if(method==='list_bounties')return fakeRpc({items:[bounty],total:1,next_offset:null});if(method==='get_bounty')return fakeRpc(bounty);throw Error('Bad method')};const result=await getBounties(cfg);assert.equal(result.length,1);assert.equal(result[0].reward_yocto,'50000000000000000000000');const single=await view(cfg,'get_bounty',{id:1});assert.equal(single.state,'OPEN')}finally{globalThis.fetch=old}});
test('no contract id means hard error, never fictitious PAID',async()=>{await assert.rejects(()=>view({...cfg,contractId:''},'get_bounty',{id:1}),/CONTRACT_NOT_CONFIGURED/)});
test('malformed chain data rejected rather than silently restored',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async()=>fakeRpc({items:[{id:1,state:'PAID',reward_yocto:100}],next_offset:null,total:1});await assert.rejects(()=>getBounties(cfg),/Invalid bounty schema/)}finally{globalThis.fetch=old}});

test('RPC paginator retrieves all 53 different on-chain bounties across 3 pages',async()=>{
 const existing=globalThis.fetch;const seen=[];
 try{
  globalThis.fetch=async(_url,options)=>{
   const body=JSON.parse(options.body);
   assert.equal(body.params.method_name,'list_bounties');
   const args=JSON.parse(Buffer.from(body.params.args_base64,'base64').toString('utf8'));
   seen.push(args.offset);
   const items=Array.from({length:Math.min(25,53-args.offset)},(_,i)=>({...bounty,id:args.offset+i+1,issue_number:args.offset+i+1}));
   return fakeRpc({items,total:53,next_offset:args.offset+items.length<53?args.offset+items.length:null});
  };
  const all=await getBounties(cfg);
  assert.deepEqual(seen,[0,25,50]);
  assert.equal(all.length,53);
  assert.equal(all.at(-1).id,53);
 }finally{globalThis.fetch=existing;}
});

test('RPC paginator refuses looping next_offset instead of giving partial results',async()=>{
 const existing=globalThis.fetch;
 try{
  globalThis.fetch=async()=>fakeRpc({items:[bounty],total:2,next_offset:0});
  await assert.rejects(()=>getBounties(cfg),/invalid bounty pagination/);
 }finally{globalThis.fetch=existing;}
});
