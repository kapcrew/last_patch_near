# Isolated JS browser test for the Live state projector. RPC and wallet are NOT connected.
# No testnet tokens are transferred; statuses are artificial test fixtures ONLY.
import asyncio,base64,re,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-web-security'])
  page=await browser.new_page(viewport={'width':1450,'height':900})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'dist/index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="/style.css">','',html);html=re.sub(r'<script type="module" src="/js/main.js"></script>','',html)
  await page.set_content(html)
  css=(ROOT/'dist/style.css').read_text();css=re.sub(r'@import url\([^;]+;', '', css)
  await page.add_style_tag(content=css)
  bg='data:image/png;base64,'+base64.b64encode((ROOT/'dist/media/twilight-city.png').read_bytes()).decode()
  await page.evaluate('''bg=>{
    window.__mockState='APPROVED';window.__offline=false;
    const b={id:1,task_key:'a'.repeat(64),repo:'example/router',issue_number:1,title:'The Broken Bridge',building_id:'bridge',maintainer:'sponsor.testnet',worker:'patcher.testnet',state:'APPROVED',reward_yocto:'50000000000000000000000',storage_reserve_yocto:'80000000000000000000000',pr_url:'https://github.com/example/router/pull/2',commit_sha:'a'.repeat(40),evidence_sha256:null,tx_nonce:0,created_at_ns:1,paid_at_ns:null};
    window.fetch=async(url,opts)=>{
      if(url==='/config.json')return new Response(JSON.stringify({contractId:'patches.example.testnet',network:'testnet',rpc:'https://rpc.testnet.fastnear.com',issueUrl:''}),{status:200});
      if(url==='/assets/manifest.json')return new Response(JSON.stringify({version:1,logicalTile:16,fallback:'procedural',background:bg}),{status:200});
      if(String(url).includes('fastnear.com')){if(window.__offline)throw new Error('Mocked RPC offline');const body=JSON.parse(opts.body);if(body.method==='status')return new Response(JSON.stringify({result:{chain_id:'testnet'}}),{status:200});if(body.method==='query' && body.params.method_name==='list_bounties'){const result={items:[{...b,state:window.__mockState}],total:1,next_offset:null};return new Response(JSON.stringify({result:{result:Array.from(new TextEncoder().encode(JSON.stringify(result)))}}),{status:200})}}
      throw new TypeError('Offline test mocks intentionally deny all other requests')}
  }''',bg)
  paths=['domain/logic.js','chain/rpc.js','chain/wallet.js','github/evidence.js','ai/fallback.js','game/AssetRegistry.js','game/BuildingPainter.js','game/WorldRenderer.js','main.js']
  mods={x:(ROOT/'dist/js'/x).read_text() for x in paths}
  # Test-only route override + skip external wallet CDN, leaving real compiled state/render logic in place.
  mods['main.js']=mods['main.js'].replace('const mode = modeForPath(location.pathname);',"const mode = 'live';")
  mods['main.js']=mods['main.js'].replace("if (mode === 'live' && config.contractId)","if (false)")
  await page.evaluate(r'''async mod=>{const urls={};for(const name of Object.keys(mod)){let src=mod[name];src=src.replace(/from ['"](\.{1,2}\/[^'"]+)['"]/g,(full,dep)=>{const parts=name.split('/');parts.pop();for(const s of dep.split('/')){if(s==='..')parts.pop();else if(s!=='.')parts.push(s)}const file=parts.join('/');return urls[file]?"from '"+urls[file]+"'":full});urls[name]=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));}await import(urls['main.js'])}''',mods)
  await page.wait_for_timeout(500)
  assert 'APPROVED' in await page.locator('#quest-detail').inner_text()
  assert '0/1 LIVE' in await page.locator('#city-health').inner_text()
  assert 'NOT PAID' in await page.locator('#proof-trail').inner_text()
  print('APPROVED: bridge not considered paid — PASS')
  await page.evaluate("window.__mockState='PAID'")
  await page.locator('#refresh').click();await page.wait_for_timeout(500)
  assert 'PAID' in await page.locator('#quest-detail').inner_text()
  assert '1/1 LIVE' in await page.locator('#city-health').inner_text()
  print('paid details=',(await page.locator('#quest-detail').inner_text())[-500:]);assert 'PATCH COMPLETE' in await page.locator('#quest-detail').inner_text()
  print('Mock RPC PAID: bridge restores only after RPC status — PASS (MOCK, NOT TESTNET)')
  await page.evaluate("window.__offline=true")
  await page.locator('#refresh').click();await page.wait_for_timeout(300)
  assert 'LIVE RPC UNAVAILABLE' in await page.locator('#quest-detail').inner_text()
  assert 'RPC failed' in await page.locator('#notice').inner_text()
  print('RPC failure: no local sample fallback — PASS')
  assert errors==[],errors
  await browser.close()
asyncio.run(run())
