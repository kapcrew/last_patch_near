// Read-only post-deployment smoke test. NO private key. NO signed transactions.
const id=process.env.CONTRACT_ID||'';
const rpc=process.env.NEAR_RPC||'https://rpc.testnet.fastnear.com';
if(!/^[a-z0-9_.-]+\.testnet$/.test(id)){
 console.error('NOT VERIFIED: Set CONTRACT_ID to an actually deployed .testnet contract account.');process.exit(2);
}
async function call(method,args={}){
 const encoded=Buffer.from(JSON.stringify(args)).toString('base64');
 const response=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:method,method:'query',params:{request_type:'call_function',finality:'final',account_id:id,method_name:method,args_base64:encoded}})});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const data=await response.json();if(data.error)throw Error(JSON.stringify(data.error));
 return JSON.parse(Buffer.from(data.result.result).toString('utf8'));
}
try{
 const config=await call('get_contract_config');const stats=await call('get_contract_stats');const page=await call('list_bounties',{offset:0,limit:25});
 if(config.network!=='testnet'||!Array.isArray(page.items))throw Error('Contract does not match expected schema');
 console.log(JSON.stringify({result:'RPC_READ_PASS',contract_id:id,config,stats,bounties:page.items.map(b=>({id:b.id,state:b.state,repo:b.repo,pr:b.pr_url}))},null,2));
}catch(e){console.error(`NOT VERIFIED: ${e.message}`);process.exit(1)}
