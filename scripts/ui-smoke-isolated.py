# Browser-rendered isolated sample smoke: uses the production compiled JS modules but
# rewrites import URLs into blobs and overrides route to /sample because this container
# prohibits all local navigation. No wallet/network or testnet transaction is tested.
import asyncio,base64,json,re,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-web-security'])
  page=await browser.new_page(viewport={'width':1450,'height':900},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'dist/index.html').read_text();html=re.sub(r'<link rel="stylesheet" href="/style.css">','',html);html=re.sub(r'<script type="module" src="/js/main.js"></script>','',html)
  await page.set_content(html)
  css=(ROOT/'dist/style.css').read_text().replace("@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');",'')
  await page.add_style_tag(content=css)
  bg='data:image/png;base64,'+base64.b64encode((ROOT/'dist/media/twilight-city.png').read_bytes()).decode()
  await page.evaluate('''(background)=>{window.fetch=async(url)=>{if(url==='/config.json')return new Response(JSON.stringify({contractId:'',network:'testnet',rpc:'',issueUrl:''}),{status:200});if(url==='/assets/manifest.json')return new Response(JSON.stringify({version:1,logicalTile:16,fallback:'procedural',background}),{status:200});throw new TypeError('Offline E2E stub');}}''',bg)
  mods={}
  paths=['domain/logic.js','chain/rpc.js','chain/wallet.js','github/evidence.js','ai/fallback.js','game/AssetRegistry.js','game/BuildingPainter.js','game/WorldRenderer.js','main.js']
  for x in paths:mods[x]=(ROOT/'dist/js'/x).read_text()
  mods['main.js']=mods['main.js'].replace('const mode = modeForPath(location.pathname);',"const mode = 'sample';")
  result=await page.evaluate(r'''async mod=>{const urls={};for(const name of Object.keys(mod)){let src=mod[name];src=src.replace(/from ['"](\.{1,2}\/[^'"]+)['"]/g,(full,dep)=>{const parts=name.split('/');parts.pop();for(const s of dep.split('/')){if(s==='..')parts.pop();else if(s!=='.')parts.push(s)}const file=parts.join('/');return urls[file] ? "from '"+urls[file]+"'" : full});urls[name]=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));}await import(urls['main.js']);return true}''',mods)
  await page.wait_for_timeout(1000)
  assert await page.locator('.quest-item').count()==4
  assert errors==[]
  print('result=',result,'quest-cards=',await page.locator('.quest-item').count(),'notice=',await page.locator('#notice').inner_text(),'errors=',errors)
  await page.screenshot(path=str(ROOT/'docs/screenshots/sample-desktop.png'),full_page=True)
  try:
   await page.locator('button[data-action="sample-claim"]').click(timeout=5000)
   print('claim=',await page.locator('#quest-detail .status-line').inner_text())
   await page.locator('button[data-action="sample-verify"]').click(timeout=5000)
   await page.locator('button[data-action="sample-review"]').click(timeout=5000)
   await page.locator('button[data-action="sample-restore"]').click(timeout=5000)
   print('restored=',await page.locator('#quest-detail .status-line').inner_text())
   await page.screenshot(path=str(ROOT/'docs/screenshots/sample-restored.png'),full_page=True)
   await page.set_viewport_size({'width':390,'height':844})
   await page.wait_for_timeout(100)
   await page.screenshot(path=str(ROOT/'docs/screenshots/sample-mobile.png'),full_page=True)
   print('mobile-scrollWidth=',await page.evaluate('document.documentElement.scrollWidth'),'viewport=',390)
   assert await page.evaluate('document.documentElement.scrollWidth')<=390
   await page.set_viewport_size({'width':320,'height':700})
   assert await page.evaluate('document.documentElement.scrollWidth')<=320
   await page.locator('button[data-quest="well"]').focus()
   await page.keyboard.press('Enter')
   assert 'The Silent Well' in await page.locator('#quest-detail h3').inner_text()
   print('keyboard=PASS, 320px mobile no horizontal overflow=PASS')
   box=await page.locator('#world').bounding_box()
   await page.mouse.click(box['x']+box['width']*(320/640),box['y']+box['height']*(258/360))
   await page.wait_for_timeout(1200)
   assert 'The Broken Bridge' in await page.locator('#quest-detail h3').inner_text()
   print('mobile canvas hit test=PASS')
   await page.set_viewport_size({'width':1450,'height':900})
   box=await page.locator('#world').bounding_box()
   await page.mouse.click(box['x']+box['width']*(130/640),box['y']+box['height']*(198/360))
   await page.wait_for_timeout(2500)
   assert 'The Silent Well' in await page.locator('#quest-detail h3').inner_text()
   print('desktop canvas hit test=PASS')
  except Exception as e:print('ACTION-FAIL',str(e)[:500]);print('error',errors)
  await browser.close()
asyncio.run(run())
