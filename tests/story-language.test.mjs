import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { MAIN_QUESTS, SIDE_QUESTS } from '../dist/js/story/generatedContent.js';
import { CAMPAIGN_QUESTS } from '../dist/js/story/content.js';

const root = resolve(import.meta.dirname, '..');
const cyrillic = /[\u0400-\u052f]/;

async function scanRuntime(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await scanRuntime(file);
    } else if (['.ts', '.js', '.mjs', '.html', '.css', '.json'].includes(extname(file))) {
      const data = await readFile(file, 'utf8');
      assert.doesNotMatch(data, cyrillic, `Non-English/Cyrillic text in runtime file ${file}`);
    }
  }
}

test('all 48 authored quests have English-only public text', () => {
  assert.equal(MAIN_QUESTS.length, 32);
  assert.equal(SIDE_QUESTS.length, 16);
  assert.equal(CAMPAIGN_QUESTS.length, 48);
  for (const quest of CAMPAIGN_QUESTS) {
    for (const field of ['title', 'npc', 'mechanic', 'beats', 'success', 'worldEffect', 'summary']) {
      assert.ok(quest[field], `${quest.id}.${field} must be present`);
      assert.doesNotMatch(quest[field], cyrillic, `${quest.id}.${field} must be in English`);
    }
  }
});

test('all runtime story and UI source files contain no Cyrillic text', async () => {
  await scanRuntime(resolve(root, 'src'));
  await scanRuntime(resolve(root, 'public'));
  for (const path of ['index.html', 'style.css']) {
    assert.doesNotMatch(await readFile(resolve(root, path), 'utf8'), cyrillic, path);
  }
});

test('compiled story and UI contain no Cyrillic text', async () => {
  await scanRuntime(resolve(root, 'dist', 'js'));
  assert.doesNotMatch(await readFile(resolve(root, 'dist/index.html'), 'utf8'), cyrillic);
});
