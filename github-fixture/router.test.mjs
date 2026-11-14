import test from 'node:test';import assert from 'node:assert/strict';import{getCrossing}from './router.mjs';
test('issue #1: the harbor to bridge crossing is traversable',()=>{assert.deepEqual(getCrossing('harbor','bridge'),{distance:5,passable:true})});
test('unknown route must remain impassable',()=>{assert.deepEqual(getCrossing('harbor','void'),{distance:Infinity,passable:false})});
