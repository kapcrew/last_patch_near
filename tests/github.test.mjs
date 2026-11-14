import test from 'node:test';import assert from 'node:assert/strict';
import{checkPR,verifyIssue,hashEvidence}from '../dist/js/github/evidence.js';
const respond=(body,status=200)=>({ok:status>=200&&status<300,status,async json(){return body}});
const SHA='a'.repeat(40);
test('github Actions checks are used when commit status API has no statuses',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async input=>{const url=String(input);if(url.endsWith('/pulls/2'))return respond({base:{repo:{full_name:'example/router'}},head:{sha:SHA},merged:true,state:'closed',body:'Fixes #1'});if(url.endsWith('/status'))return respond({total_count:0,state:'pending'});if(url.endsWith('/check-runs'))return respond({total_count:1,check_runs:[{status:'completed',conclusion:'success'}]});throw Error('unexpected '+url)};
  const result=await checkPR('https://github.com/example/router/pull/2','example/router',1);
  assert.equal(result.status,'READY_FOR_MANUAL_REVIEW');assert.equal(result.ci,'success');assert.equal(result.linkedIssue,true);assert.equal(result.merged,true);assert.equal(result.headSha,SHA);
  assert.equal((await hashEvidence(result,1)).length,64);
 }finally{globalThis.fetch=original}
});
test('403 and incomplete GitHub evidence never becomes verified',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async()=>respond({},403);const e=await checkPR('https://github.com/example/router/pull/2','example/router',1);assert.equal(e.status,'EVIDENCE_UNAVAILABLE');assert.equal(e.headSha,'');assert.equal(e.ci,'unknown')}finally{globalThis.fetch=original}});
test('merged PR with failed checks is not ready for maintainer release',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async input=>{const url=String(input);if(url.endsWith('/pulls/2'))return respond({base:{repo:{full_name:'example/router'}},head:{sha:SHA},merged:true,body:'Fixes #1'});if(url.endsWith('/status'))return respond({total_count:1,state:'failure'});return respond({},404)};const e=await checkPR('https://github.com/example/router/pull/2','example/router',1);assert.equal(e.ci,'failure');assert.equal(e.status,'PENDING_MERGE')}finally{globalThis.fetch=old}});
test('sponsor can only fund a public actual GitHub issue',async()=>{const old=globalThis.fetch;try{globalThis.fetch=async()=>respond({state:'open'});assert.equal((await verifyIssue('https://github.com/example/router/issues/12')).number,12);globalThis.fetch=async()=>respond({},404);await assert.rejects(()=>verifyIssue('https://github.com/example/router/issues/12'),/HTTP 404/)}finally{globalThis.fetch=old}});
