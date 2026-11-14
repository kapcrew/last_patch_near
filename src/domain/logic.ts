export type BuildingId='bridge'|'well'|'library'|'forge';
export type SampleStatus='BROKEN'|'CLAIMED'|'VERIFIED'|'AWAITING_REVIEW'|'RESTORED';
export type LiveStatus='OPEN'|'CLAIMED'|'SUBMITTED'|'APPROVED'|'WITHDRAWING'|'PAID'|'CANCELLING'|'CANCELLED';
export type SampleAction='claim'|'verify'|'review'|'restore'|'reset';
export interface Quest {id:BuildingId; title:string; npc:string; problem:string; detail:string; quote:string; restoredQuote:string; reward:string; symbol:string; issueHint:string}
export const QUESTS:Quest[]=[
 {id:'bridge',title:'The Broken Bridge',npc:'Bridgekeeper',problem:'Broken dependency causes a bridge-routing failure.',detail:'The route ends where the code gives up. Fix the public routing bug and submit a pull request.',quote:'The route ends where the code gives up.',restoredQuote:'A clean merge. A safe crossing. Thank you.',reward:'0.05',symbol:'⚒',issueHint:'Routing / dependency regression'},
 {id:'well',title:'The Silent Well',npc:'Water Witch',problem:'A null response freezes the water API.',detail:'The well responds with nothing. Patch the API null handling to bring back the water.',quote:'The well answers with nothing.',restoredQuote:'The water remembers how to flow.',reward:'0.03',symbol:'◉',issueHint:'Null API response'},
 {id:'library',title:'The Dark Library',npc:'Paper Golem',problem:'Installation docs omit a required environment variable.',detail:'One missing line keeps the books sealed. Repair the setup guide.',quote:'One missing line hides a thousand answers.',restoredQuote:'The books can teach again.',reward:'0.02',symbol:'▣',issueHint:'Missing env configuration'},
 {id:'forge',title:'The Sleeping Forge',npc:'Iron Fox',problem:'Regression tests do not cover forged request payloads.',detail:'The forge sleeps until malicious payloads are covered by tests.',quote:'If no one tests the gate, a forgery walks through.',restoredQuote:'Now the hammer strikes only what is true.',reward:'0.04',symbol:'⚙',issueHint:'Security regression tests'}
];
export const INITIAL_SAMPLE:Record<BuildingId,SampleStatus>={bridge:'BROKEN',well:'BROKEN',library:'BROKEN',forge:'BROKEN'};
const transitions:Record<SampleAction,Partial<Record<SampleStatus,SampleStatus>>>= {
 claim:{BROKEN:'CLAIMED'},verify:{CLAIMED:'VERIFIED'},review:{VERIFIED:'AWAITING_REVIEW'},restore:{AWAITING_REVIEW:'RESTORED'},reset:{BROKEN:'BROKEN',CLAIMED:'BROKEN',VERIFIED:'BROKEN',AWAITING_REVIEW:'BROKEN',RESTORED:'BROKEN'}
};
export function sampleNext(status:SampleStatus,action:SampleAction):SampleStatus{const next=transitions[action][status];if(!next)throw new Error(`Invalid sample transition ${status}/${action}`);return next;}
export function isRestoredLive(status:LiveStatus|null|undefined){return status==='PAID';}
export function visualState(status:LiveStatus|null|undefined):'broken'|'progress'|'restored'{if(status==='PAID')return'restored';if(['CLAIMED','SUBMITTED','APPROVED','WITHDRAWING'].includes(status||''))return 'progress';return'broken';}
export function healthLive(bounties:ReadonlyArray<{state:LiveStatus}>){const total=bounties.length;const paid=bounties.filter(b=>isRestoredLive(b.state)).length;return {paid,total,percent:total?Math.floor(paid*100/total):0};}
export function decimalNearToYocto(value:string):string{if(!/^(0|[1-9]\d*)(\.\d{1,24})?$/.test(value))throw new Error('Enter a decimal NEAR amount (max 24 places).');const [whole,decimal='']=value.split('.');return(BigInt(whole)*10n**24n+BigInt((decimal+'0'.repeat(24)).slice(0,24))).toString();}
export function yoctoToNear(value:string):string{if(!/^\d+$/.test(value))return'—';const v=BigInt(value),base=10n**24n;let frac=(v%base).toString().padStart(24,'0').slice(0,5).replace(/0+$/,'');return(v/base).toString()+(frac?'.'+frac:'');}
export const STORAGE_RESERVE_YOCTO= '80000000000000000000000'; // 0.08 NEAR; permanent data collateral, never reward
