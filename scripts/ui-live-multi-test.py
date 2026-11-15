"""Isolated headless UI test (MOCK RPC + MOCK wallet). Never sends NEAR transactions."""
import asyncio, base64, json, re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
MOCK_WALLET = """export class NearWallet {
 accountId='intent.testnet'; onChange=()=>{};
 async init(){this.onChange()}
 async connect(){this.onChange()}
 async disconnect(){this.accountId=null;this.onChange()}
 async change(config,method,args,deposit){
  if(method==='create_bounty'){
   const id=Math.max(0,...window.__mockBounties.map(x=>x.id))+1;
   window.__mockBounties.push({id,task_key:'a'.repeat(64),repo:args.repo,issue_number:args.issue_number,
     title:args.title,building_id:args.building_id,maintainer:this.accountId,worker:null,state:'OPEN',
     reward_yocto:args.reward_yocto,storage_reserve_yocto:'80000000000000000000000',
     pr_number:null,pr_url:null,commit_sha:null,evidence_sha256:null,tx_nonce:0,created_at_ns:1,paid_at_ns:null});
  }
  return {transaction:{hash:'a'.repeat(44)}};
 }
}"""

async def run():
 async with async_playwright() as p:
  browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-web-security'])
  page = await browser.new_page(viewport={'width':1440,'height':900})
  errors=[]
  page.on('pageerror', lambda e: errors.append(str(e)))
  html=(ROOT/'dist/index.html').read_text()
  html=html.replace('<link rel="stylesheet" href="/style.css">','')
  html=html.replace('<script type="module" src="/js/main.js"></script>','')
  await page.set_content(html)
  css=(ROOT/'dist/style.css').read_text()
  css=re.sub(r'^@import[^\n]*\n', '', css)
  await page.add_style_tag(content=css)
  bg='data:image/png;base64,'+base64.b64encode((ROOT/'dist/media/twilight-city.png').read_bytes()).decode()
  initial=[
   {'id':1,'title':'First bridge repair','repo':'example/router','issue_number':1,'building_id':'bridge','state':'CANCELLED'},
   {'id':2,'title':'Second bridge repair','repo':'example/router','issue_number':2,'building_id':'bridge','state':'OPEN'},
   {'id':3,'title':'Well restored','repo':'example/water','issue_number':3,'building_id':'well','state':'PAID'},
  ]
  for b in initial:
   b.update(task_key='a'*64,maintainer='intent.testnet',worker=None,
     reward_yocto='50000000000000000000000',storage_reserve_yocto='80000000000000000000000',
     pr_number=None,pr_url=None,commit_sha=None,evidence_sha256=None,
     tx_nonce=0,created_at_ns=1,paid_at_ns=None)
  fake_fetch = """data=>{
   window.__mockBounties=data.rows;
   const memoryStore=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>memoryStore.get(k)??null,setItem:(k,v)=>memoryStore.set(k,String(v)),removeItem:k=>memoryStore.delete(k),clear:()=>memoryStore.clear()}});
   window.fetch=async(url,opts)=>{
    if(url==='/config.json')return new Response(JSON.stringify({contractId:'lastpatch.intent.testnet',network:'testnet',rpc:'https://rpc.testnet.fastnear.com',issueUrl:''}),{status:200});
    if(url==='/assets/manifest.json')return new Response(JSON.stringify({version:2,logicalTile:16,fallback:'procedural',entries:{},background:data.bg}),{status:200});
    if(String(url).includes('rpc.testnet.fastnear.com')){
     const body=JSON.parse(opts.body);
     if(body.method==='status')return new Response(JSON.stringify({result:{chain_id:'testnet'}}),{status:200});
     if(body.method==='query'&&body.params.method_name==='list_bounties'){
      const rows=window.__mockBounties;
      const bytes=Array.from(new TextEncoder().encode(JSON.stringify({items:rows,total:rows.length,next_offset:null})));
      return new Response(JSON.stringify({result:{result:bytes}}),{status:200});
     }
    }
    if(String(url).startsWith('https://api.github.com/repos/'))return new Response(JSON.stringify({state:'open'}),{status:200});
    throw Error('Mock blocked external request: '+url);
   };
  }"""
  await page.evaluate(fake_fetch, {'rows':initial,'bg':bg})
  order=['domain/logic.js','chain/rpc.js','chain/wallet.js','github/evidence.js','ai/fallback.js',
    'game/BuildingPainter.js','game/WorldRenderer.js','game/AssetRegistry.js','game/StoryRenderer.js',
    'story/generatedContent.js','story/content.js','story/save.js','main.js']
  mods={name:(ROOT/'dist/js'/name).read_text() for name in order}
  mods['chain/wallet.js']=MOCK_WALLET
  mods['main.js']=mods['main.js'].replace('const mode = modeForPath(location.pathname);', "const mode = 'live';")
  loader = r"""async (data)=>{
   const urls={};
   for(const name of data.order){
    let src=data.mods[name];
    src=src.replace(/from ['"](\.{1,2}\/[^'"]+)['"]/g,(orig,dep)=>{
     const parts=name.split('/');parts.pop();
     for(const x of dep.split('/')){if(x==='..')parts.pop();else if(x!=='.')parts.push(x)}
     const resolved=parts.join('/');
     if(!urls[resolved])throw Error('Missing dependency '+resolved+' in '+name);
     return "from '"+urls[resolved]+"'";
    });
    urls[name]=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
   }
   await import(urls['main.js']);
  }"""
  await page.evaluate(loader, {'order':order,'mods':mods})
  await page.locator('[data-bounty-id="1"]').wait_for(timeout=10000)
  assert await page.locator('[data-bounty-id]').count()==3
  print('Existing CANCELLED + OPEN + PAID records rendered: PASS')
  await page.locator('[data-bounty-id="1"]').click()
  assert 'CANCELLED' in await page.locator('#quest-detail').inner_text()
  await page.locator('#quest-detail [data-action="new-bounty"]').click()
  assert await page.locator('#issue-url').count()==1
  print('New bounty available after CANCELLED: PASS')
  await page.locator('#issue-url').fill('https://github.com/example/router/issues/4')
  await page.locator('#bounty-title').fill('Fix bridge routing again')
  await page.locator('#quest-detail [data-action="create"]').click()
  await page.locator('[data-bounty-id="4"]').wait_for(timeout=10000)
  assert await page.locator('[data-bounty-id]').count()==4
  assert 'Bounty #4 confirmed' in await page.locator('#notice').inner_text()
  print('New bounty #4 confirmed from mocked RPC: PASS')
  await page.locator('#quest-detail [data-action="new-bounty"]').click()
  await page.locator('#issue-url').fill('https://github.com/example/router/issues/5')
  await page.locator('#bounty-title').fill('Fix another bridge regression')
  await page.locator('#quest-detail [data-action="create"]').click()
  await page.locator('[data-bounty-id="5"]').wait_for(timeout=10000)
  assert await page.locator('[data-bounty-id]').count()==5
  print('New bounty #5 while earlier #4 is OPEN: PASS')
  await page.locator('[data-bounty-id="3"]').click()
  assert 'PAID' in await page.locator('#quest-detail').inner_text()
  assert 'SELECTED BOUNTY #3' in await page.locator('#proof-trail').inner_text()
  assert 'PAYOUT: CONFIRMED' in await page.locator('#proof-trail').inner_text()
  print('Independent PAID bounty selected with correct proof: PASS')
  assert not errors,errors
  print('CSS:',await page.evaluate("['body','.sidebar','.stage','.button.primary'].map(s=>{const x=document.querySelector(s);const c=getComputedStyle(x);return [s,c.backgroundColor,c.color,c.fontFamily]})"))
  await page.screenshot(path=str(ROOT/'docs/live-multi-bounty-tested.png'),full_page=True)
  print('No JS page errors. Screenshot saved.')
  await browser.close()

asyncio.run(run())
