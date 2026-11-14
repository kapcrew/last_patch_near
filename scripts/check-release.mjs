import{existsSync}from 'node:fs';
const checks=[
 ['RUST LOCKFILE',existsSync('contracts/bounty/Cargo.lock')],
 ['WASM COMPILED',existsSync('contracts/bounty/target/near/the_last_patch_bounty.wasm')||existsSync('contracts/bounty/target/wasm32-unknown-unknown/release/the_last_patch_bounty.wasm')],
 ['REAL CONTRACT ID',/\.testnet$/.test(process.env.CONTRACT_ID||'')],
 ['REAL PUBLIC ISSUE',/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(process.env.GITHUB_ISSUE_URL||'')],
 ['REAL PUBLIC PR',/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(process.env.GITHUB_PR_URL||'')],
 ['PAYOUT EXPLORER URL FORMAT (manual receipt verification required)',/^https:\/\/testnet\.nearblocks\.io\/txns\/[A-Za-z0-9]{40,60}$/.test(process.env.PAYOUT_TX_URL||'')],
 ['PUBLIC HTTPS GAME',/^https:\/\/\S+/.test(process.env.PUBLIC_GAME_URL||'')],
];
for(const [label,ok]of checks)console.log(`${ok?'PASS':'MISSING'} ${label}`);
if(checks.some(x=>!x[1])){console.error('RELEASE BLOCKED: required fields/files incomplete; this script cannot validate blockchain receipts, do not claim ready for NEAR Hackathon');process.exit(1)}
