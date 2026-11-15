import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const renderer=readFileSync(new URL('src/game/StoryRenderer.ts',root),'utf8');
const main=readFileSync(new URL('src/main.ts',root),'utf8');
const css=readFileSync(new URL('style.css',root),'utf8');
test('crossing scene never draws the old opaque blue river / green ground covers',()=>{
  assert.doesNotMatch(renderer,/this\.fill\(278,0,86,360/);
  assert.doesNotMatch(renderer,/this\.fill\(0,286,640,74,'#446e5c'/);
  assert.match(renderer,/if\(this\.districtId==='crossing'\)return;/);
});
test('story overlays do not overlap the canvas HUD',()=>{
  assert.match(main,/document\.body\.classList\.toggle\('story-mode'/);
  assert.match(css,/body\.story-mode \.world-overlay\{display:none\}/);
});
test('quest family is displayed with the quest metadata instead of wrapping inside the tiny icon square',()=>{
  assert.match(main,/class=\"quest-copy\"/);
  assert.match(main,/class=\"quest-family\"/);
  assert.doesNotMatch(main.slice(main.indexOf('function renderStoryList'),main.indexOf('function renderStoryDetail')),/class=\"quest-kind\"/);
});
