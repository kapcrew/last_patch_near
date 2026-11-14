import {QUESTS,INITIAL_SAMPLE,sampleNext,visualState,healthLive,yoctoToNear,decimalNearToYocto,STORAGE_RESERVE_YOCTO,type BuildingId,type SampleStatus,type SampleAction,type LiveStatus} from './domain/logic.js';
import {type Config,type Bounty,getBounties,view,rpcHealth} from './chain/rpc.js';
import {NearWallet} from './chain/wallet.js';
import {checkPR,parseGitHubIssue,verifyIssue,hashEvidence,type Evidence} from './github/evidence.js';
import {explainQuest} from './ai/fallback.js';
import {AssetRegistry} from './game/AssetRegistry.js';
import {WorldRenderer} from './game/WorldRenderer.js';
import {StoryRenderer,type Hotspot} from './game/StoryRenderer.js';
import {ACHIEVEMENTS,CAMPAIGN_QUESTS,DISTRICTS,QUEST_BY_ID,districtForQuest,nextDistrictId} from './story/content.js';
import {calcScore,clearSlot,createNewSave,getActiveSlot,getLocalLeaderboard,loadOrCreate,questCount,saveGame,setActiveSlot,syncAchievements} from './story/save.js';
import type {CampaignQuest,DistrictId,PuzzleFamily,StoryState} from './story/types.js';

type Mode='home'|'story'|'live'|'about'|'legal'|'404';
type StoryTab='overview'|'inventory'|'achievements'|'leaderboard';
interface PuzzleSession{questId:string;family:PuzzleFamily;correctIndex:number;choice:number|null;options:string[];ordered:string[];shuffled:string[];sequence:string[];toggles:boolean[];targetToggles:boolean[];hintLevel:number;feedback:string;generic:boolean;acceptAny:boolean}

const $=(id:string)=>document.getElementById(id)!;
const escape=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const explorerTx=(hash:string)=>`https://testnet.nearblocks.io/txns/${encodeURIComponent(hash)}`;
const modeForPath=(path:string):Mode=>path==='/'?'home':path==='/sample'||path==='/play'?'story':path==='/live'||path.startsWith('/live/')?'live':path==='/about'?'about':path==='/legal'?'legal':'404';
const mode=modeForPath(location.pathname);

let storyState:StoryState=loadOrCreate(getActiveSlot());
let storyTab:StoryTab='overview';
let selectedQuestId=storyState.activeQuestId || 'CR-01';
let puzzleSession:PuzzleSession|null=null;
let storyRenderer:StoryRenderer|undefined;
let liveRenderer:WorldRenderer|undefined;
let assets:AssetRegistry;
let playTimer:number|undefined;

let selectedLive:BuildingId='bridge';
let sample={...INITIAL_SAMPLE};
let bounties:Bounty[]=[];
let evidence:Evidence|null=null;
let config:Config={contractId:'',network:'testnet',rpc:'https://rpc.testnet.fastnear.com',issueUrl:''};
let error='';
const wallet=new NearWallet();
let loading=false;
const txRecord:{method:string;hash:string}[]=[];

const modal=document.createElement('div');modal.className='modal-backdrop hidden';modal.innerHTML='<div class="modal-card" id="modal-card"></div>';
document.body.appendChild(modal);
const modalCard=()=>document.getElementById('modal-card')!;

function notice(msg:string){$('notice').textContent=msg;}
function hashString(v:string){let h=0;for(let i=0;i<v.length;i++)h=(h*31+v.charCodeAt(i))>>>0;return h;}
function shuffle<T>(input:T[],seed:number){const arr=input.slice();for(let i=arr.length-1;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function minutesLabel(n:number){return `${n} min`}
function currentQuest(){return QUEST_BY_ID.get(selectedQuestId) || CAMPAIGN_QUESTS[0];}
function done(id:string){return storyState.questStates[id]==='done';}
function districtMainDone(d:DistrictId){return CAMPAIGN_QUESTS.filter(q=>q.district===d&&q.kind==='main'&&done(q.id)).length;}
function districtSideDone(d:DistrictId){return CAMPAIGN_QUESTS.filter(q=>q.district===d&&q.kind==='side'&&done(q.id)).length;}
function districtUnlocked(d:DistrictId){const info=DISTRICTS.find(x=>x.id===d)!;return !info.unlockFrom || done(info.unlockFrom) || storyState.worldFlags[`${d}Unlocked`];}
function districtProgress(d:DistrictId){return Math.round((districtMainDone(d)/8)*100);}
function districtRestored(d:DistrictId){return districtMainDone(d)>=8;}
function allDone(){return questCount(storyState).done;}
function availableForDistrict(d:DistrictId){return CAMPAIGN_QUESTS.filter(q=>q.district===d && (storyState.questStates[q.id]==='available' || storyState.questStates[q.id]==='tracking' || storyState.questStates[q.id]==='done'));}
function storyView(){return {districtId:storyState.districtId,districtProgress:districtProgress(storyState.districtId),completedMain:districtMainDone(storyState.districtId),completedSide:districtSideDone(storyState.districtId),trackedQuestLabel:(currentQuest()?.title)||'No tracked quest',worldFlags:storyState.worldFlags};}

function ensureStoryProgress(){
  for(const info of DISTRICTS){if(info.unlockFrom===null)storyState.worldFlags[`${info.id}Unlocked`]=true; else if(done(info.unlockFrom))storyState.worldFlags[`${info.id}Unlocked`]=true; if(districtRestored(info.id))storyState.worldFlags[`${info.id}Restored`]=true;}
  for(const q of CAMPAIGN_QUESTS){
    const existing=storyState.questStates[q.id] || 'locked';
    if(existing==='done')continue;
    const prereqMet=q.prerequisite.every(done);
    const unlocked=districtUnlocked(q.district) && prereqMet;
    if(unlocked && existing==='locked')storyState.questStates[q.id]='available';
  }
  const active=currentQuest();
  if(!active || storyState.questStates[active.id]==='done'){
    const next=CAMPAIGN_QUESTS.find(q=>storyState.questStates[q.id]==='available'&& q.district===storyState.districtId) || CAMPAIGN_QUESTS.find(q=>storyState.questStates[q.id]==='available');
    if(next){selectedQuestId=next.id;storyState.activeQuestId=next.id;storyState.districtId=next.district;}
  }
  syncAchievements(storyState);
}
ensureStoryProgress();

function addInventory(item:string){if(!storyState.inventory.includes(item))storyState.inventory.push(item);}
function rewardItemForQuest(id:string){const items:Record<string,string>={'CR-01':'Lens','CR-07':'Lantern Key','LQ-05':'Relay Coil','AR-02':'Archive Seal','FR-02':'Iron Hammer','FR-07':'Signal Prism','S-10':'Margin Charm','S-14':'Fox Tool'};return items[id]||'';}
function autosave(){saveGame(storyState);}
function switchSlot(slot:number){setActiveSlot(slot);storyState=loadOrCreate(slot);selectedQuestId=storyState.activeQuestId||'CR-01';storyTab='overview';ensureStoryProgress();renderStory();notice(`Loaded save slot ${slot}.`);} 

function genericDialogue(quest:CampaignQuest,status:'locked'|'available'|'done',hotspot?:Hotspot){
  const speaker=hotspot?.npcName || quest.npc;
  const intro=status==='done'?`You already solved ${quest.title}. The town still remembers it.`:status==='locked'?`We are not ready for ${quest.title} yet.`:`${speaker} needs help with ${quest.title}.`;
  openModal(`<span class="npc-tip">${escape(speaker)}</span><h3>${escape(quest.title)}</h3><div class="dialogue-log"><div class="speech"><strong>${escape(speaker)}</strong><div>${escape(intro)}</div></div><div class="speech"><strong>Patchkeeper</strong><div>${escape(quest.summary)}</div></div></div><div class="help-box">${escape(quest.worldEffect)}</div><div class="play-controls"><button class="button outline" data-modal="close">CLOSE</button>${status==='available'?'<button class="button primary" data-modal="start">START QUEST</button>':''}</div>`);
  bindModalButtons({start:()=>startQuest(quest.id),close:closeModal});
}

function puzzleTemplate(q:CampaignQuest):PuzzleSession{
  const seed=hashString(q.id+q.title);
  const generic=q.kind==='side';
  const optionsBase={
    diff:[q.success,q.worldEffect.replace(/;.*$/,''),'Ship a patch that breaks the old route'],
    signature:['Maintainer approves, worker submits, visitor cannot approve.','Any visitor may approve if the patch looks useful.','The courier alone controls every payout.'],
    choice:[q.success,q.beats.split(';')[0]||q.beats,'Ignore the town and leave the district as-is']
  } as Record<string,string[]>;
  const orderedBase={
    dependency:['Inspect dependencies','Remove the cycle','Reconnect the safe route','Run the load test'],
    clock:['Read the log','Order the events','Resolve the duplicate','Confirm the repaired signal'],
    relay:['Prime the beacon','Place the relays','Send the checksum','Watch the lights return']
  } as Record<string,string[]>;
  const toggles=['Fallback valve','Retry gate','Cache siphon','Drain latch'];
  if(q.id==='FR-08')return {questId:q.id,family:'choice',correctIndex:0,choice:null,options:['Rebuild with strict order','Rebuild with mercy and memory'],ordered:[],shuffled:[],sequence:[],toggles:[],targetToggles:[],hintLevel:0,feedback:'',generic:false,acceptAny:true};
  switch(q.puzzleFamily){
    case 'diff':
    case 'signature':
    case 'choice':{const options=shuffle(optionsBase[q.puzzleFamily],seed); const correctIndex=options.indexOf(optionsBase[q.puzzleFamily][0]); return {questId:q.id,family:q.puzzleFamily,correctIndex,choice:null,options,ordered:[],shuffled:[],sequence:[],toggles:[],targetToggles:[],hintLevel:0,feedback:'',generic,acceptAny:false};}
    case 'dependency':
    case 'clock':
    case 'relay':{const ordered=orderedBase[q.puzzleFamily]; return {questId:q.id,family:q.puzzleFamily,correctIndex:0,choice:null,options:[],ordered,shuffled:shuffle(ordered,seed),sequence:[],toggles:[],targetToggles:[],hintLevel:0,feedback:'',generic,acceptAny:false};}
    case 'nullflow': default:{const target=[Boolean(seed&1),Boolean(seed&2),Boolean(seed&4),Boolean(seed&8)]; return {questId:q.id,family:'nullflow',correctIndex:0,choice:null,options:[],ordered:[],shuffled:[],sequence:[],toggles:[false,false,false,false],targetToggles:target,hintLevel:0,feedback:'',generic,acceptAny:false};}
  }
}

function renderPuzzleBody(session:PuzzleSession,q:CampaignQuest){
  const feedback=session.feedback?`<div class="feedback ${session.feedback.startsWith('Success')?'ok':'bad'}">${escape(session.feedback)}</div>`:'';
  const hints=[`Hint I: ${q.beats.split(';')[0]||q.beats}.`,`Hint II: ${q.success}.`];
  const hintText=session.hintLevel?`<div class="help-box">${escape(hints[Math.min(session.hintLevel-1,hints.length-1)])}</div>`:'';
  let body='';
  if(session.family==='diff'||session.family==='signature'||session.family==='choice'){
    body=`<div class="puzzle-option-grid">${session.options.map((o,i)=>`<button class="puzzle-option ${session.choice===i?'selected':''}" data-puzzle="choice" data-index="${i}">${escape(o)}</button>`).join('')}</div>`;
  } else if(session.family==='dependency'||session.family==='clock'||session.family==='relay'){
    body=`<div class="legend"><span>Click the steps in the right order.</span><span>Sequence: ${escape(session.sequence.join(' → ')||'empty')}</span></div><div class="puzzle-option-grid">${session.shuffled.map((o)=>`<button class="sequence-chip ${session.sequence.includes(o)?'selected':''}" data-puzzle="step" data-value="${escape(o)}">${escape(o)}</button>`).join('')}</div><div class="puzzle-row"><button class="button outline" data-puzzle="clear">CLEAR</button></div>`;
  } else {
    body=`<div class="legend"><span>Match the fallback circuit to the required flow.</span></div><div class="puzzle-option-grid">${['Fallback valve','Retry gate','Cache siphon','Drain latch'].map((name,i)=>`<button class="toggle-chip ${session.toggles[i]?'active':''}" data-puzzle="toggle" data-index="${i}">${escape(name)}<br><small>${session.toggles[i]?'ON':'OFF'}</small></button>`).join('')}</div>`;
  }
  return `<span class="npc-tip">${escape(q.npc)} · ${escape(q.mechanic)}</span><h3>${escape(q.title)}</h3><div class="dialogue-log"><div class="speech"><strong>${escape(q.npc)}</strong><div>${escape(q.beats)}</div></div><div class="speech"><strong>Goal</strong><div>${escape(q.success)}</div></div></div><div class="puzzle-box">${body}${feedback}${hintText}</div><div class="play-controls"><button class="button outline" data-modal="hint">HINT</button><button class="button outline" data-modal="close">LEAVE</button><button class="button primary" data-modal="submit">SUBMIT</button></div>`;
}

function openModal(html:string){modal.classList.remove('hidden');modalCard().innerHTML=html;}
function closeModal(){modal.classList.add('hidden');puzzleSession=null;}
function bindModalButtons(map:Record<string,()=>void>){modalCard().querySelectorAll<HTMLElement>('[data-modal]').forEach(el=>el.addEventListener('click',()=>{const key=el.dataset.modal||''; map[key]?.();}));}
function bindPuzzleButtons(session:PuzzleSession,q:CampaignQuest){
  modalCard().querySelectorAll<HTMLElement>('[data-puzzle="choice"]').forEach(el=>el.addEventListener('click',()=>{session.choice=Number(el.dataset.index);renderPuzzle(q,session);}));
  modalCard().querySelectorAll<HTMLElement>('[data-puzzle="step"]').forEach(el=>el.addEventListener('click',()=>{const value=String(el.dataset.value||''); if(!session.sequence.includes(value))session.sequence.push(value); renderPuzzle(q,session);}));
  modalCard().querySelectorAll<HTMLElement>('[data-puzzle="toggle"]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.index);session.toggles[i]=!session.toggles[i]; renderPuzzle(q,session);}));
  modalCard().querySelectorAll<HTMLElement>('[data-puzzle="clear"]').forEach(el=>el.addEventListener('click',()=>{session.sequence=[]; renderPuzzle(q,session);}));
  bindModalButtons({close:closeModal,hint:()=>{session.hintLevel=Math.min(session.hintLevel+1,2); renderPuzzle(q,session);},submit:()=>submitPuzzle(q,session)});
}
function renderPuzzle(q:CampaignQuest,session:PuzzleSession){openModal(renderPuzzleBody(session,q)); bindPuzzleButtons(session,q);} 
function submitPuzzle(q:CampaignQuest,session:PuzzleSession){
  let success=false;
  if(session.family==='diff'||session.family==='signature'||session.family==='choice') success=session.acceptAny || session.choice===session.correctIndex;
  else if(session.family==='dependency'||session.family==='clock'||session.family==='relay') success=JSON.stringify(session.sequence)===JSON.stringify(session.ordered);
  else success=JSON.stringify(session.toggles)===JSON.stringify(session.targetToggles);
  if(success){
    if(q.id==='FR-08' && session.choice!==null){storyState.endingChoice=session.choice===0?'order':'mercy';}
    session.feedback='Success! The district changes around you.'; completeQuest(q); closeModal();
  } else {session.feedback='Not yet. The town reacts, but the patch is incomplete.'; renderPuzzle(q,session);} }
function startQuest(id:string){const q=QUEST_BY_ID.get(id); if(!q)return; storyState.activeQuestId=id; selectedQuestId=id; storyState.questStates[id]='tracking'; puzzleSession=puzzleTemplate(q); renderPuzzle(q,puzzleSession);}

function completeQuest(q:CampaignQuest){
  storyState.questStates[q.id]='done';
  storyState.resources.sparks+=q.reward.sparks;
  storyState.resources.memory+=q.reward.memory;
  storyState.resources.reputation+=q.reward.reputation;
  const item=rewardItemForQuest(q.id); if(item)addInventory(item);
  if(q.id==='CR-07' && nextDistrictId('crossing')) storyState.worldFlags['lanternUnlocked']=true;
  if(q.id==='LQ-07') storyState.worldFlags['archiveUnlocked']=true;
  if(q.id==='AR-07') storyState.worldFlags['foundryUnlocked']=true;
  if(q.id==='FR-08') storyState.worldFlags['campaignComplete']=true;
  ensureStoryProgress();
  const next=CAMPAIGN_QUESTS.find(x=>storyState.questStates[x.id]==='available' && x.district===storyState.districtId) || CAMPAIGN_QUESTS.find(x=>storyState.questStates[x.id]==='available');
  if(next){selectedQuestId=next.id;storyState.activeQuestId=next.id;storyState.districtId=next.district;}
  autosave();
  notice(`${q.title} complete. +${q.reward.sparks} Sparks, +${q.reward.reputation} Reputation${q.reward.memory?`, +${q.reward.memory} Memory`:''}.`);
  renderStory();
}

function handleHotspot(h:Hotspot){
  if(h.type==='gate'){
    if(h.target && districtUnlocked(h.target)){storyState.districtId=h.target; ensureStoryProgress(); renderStory(); notice(`Entered ${DISTRICTS.find(x=>x.id===h.target)?.title}.`);} else notice('This route is still blocked. Restore the current district first.');
    return;
  }
  const candidate=(h.questIds||[]).map(id=>QUEST_BY_ID.get(id)).filter(Boolean) as CampaignQuest[];
  const q=candidate.find(x=>storyState.questStates[x.id]==='tracking') || candidate.find(x=>storyState.questStates[x.id]==='available') || candidate[0] || currentQuest();
  if(!q)return;
  selectedQuestId=q.id;storyState.activeQuestId=q.id;
  const status=storyState.questStates[q.id]||'locked';
  if(status==='available'||status==='tracking')startQuest(q.id); else genericDialogue(q,status as 'locked'|'available'|'done',h);
  renderStory();
}

function renderStoryHUD(){const district=DISTRICTS.find(x=>x.id===storyState.districtId)!;$('city-health').textContent=district.title; const counts=questCount(storyState); $('live-repairs').textContent=`${counts.done}/${counts.total}`; $('locked-total').textContent=String(storyState.resources.sparks); $('pending-reward').textContent=String(storyState.resources.reputation); $('mode-badge').textContent='STORY MODE'; $('stage-title').textContent=district.title; $('stage-subtitle').textContent=district.subtitle; $('world-coordinate').textContent=`${districtProgress(storyState.districtId)}% restored`; $('panel-intro').textContent='A full offline campaign with quests, side stories, inventory, achievements and local leaderboard.'; $('intro').hidden=true; $('quest-count').textContent=String(CAMPAIGN_QUESTS.filter(q=>q.district===storyState.districtId).length).padStart(2,'0'); }
function storyStatusLabel(id:string){const s=storyState.questStates[id]||'locked';return s==='done'?'DONE':s==='tracking'?'TRACKED':s.toUpperCase();}
function questSymbol(q:CampaignQuest){return q.kind==='main'?'MAIN':'SIDE'}
function renderStoryList(){const list=availableForDistrict(storyState.districtId); $('quest-list').innerHTML=list.map(q=>`<button class="quest-item ${(storyState.questStates[q.id]||'locked')}" data-story-quest="${q.id}" role="listitem" aria-pressed="${selectedQuestId===q.id}"><span class="quest-symbol"><strong>${escape(questSymbol(q))}</strong><span class="quest-kind">${escape(q.puzzleFamily)}</span></span><span><h3>${escape(q.title)}</h3><small>${escape(q.npc)} · ${escape(minutesLabel(q.minutes))}</small></span><span class="right">${storyStatusLabel(q.id)}</span></button>`).join(''); document.querySelectorAll<HTMLElement>('[data-story-quest]').forEach(el=>el.addEventListener('click',()=>{selectedQuestId=String(el.dataset.storyQuest); storyState.activeQuestId=selectedQuestId; renderStory();}));}
function renderStoryDetail(){const q=currentQuest(); const status=storyState.questStates[q.id]||'locked'; const districtGrid=DISTRICTS.map(d=>`<div class="district-cell ${storyState.districtId===d.id?'current':''} ${districtRestored(d.id)?'done':''}"><strong>${escape(d.title)}</strong><small>${districtMainDone(d.id)}/8 main · ${districtSideDone(d.id)}/4 side</small></div>`).join(''); const mainAction=status==='available'||status==='tracking'?`<button class="button primary" data-story-action="start">${status==='tracking'?'CONTINUE QUEST':'START QUEST'}</button>`:''; $('quest-detail').innerHTML=`<span class="tag ${status==='done'?'paid':'sample'}">${escape(status.toUpperCase())}</span><h3>${escape(q.title)}</h3><span class="eyebrow">${escape(q.npc)} / ${escape(q.mechanic)}</span><p>${escape(q.summary)}</p><div class="section-title">OBJECTIVES</div><ul><li>${escape(q.beats)}</li><li>${escape(q.success)}</li><li>${escape(q.worldEffect)}</li></ul><div class="resource-grid"><div class="resource-card"><small>REWARD</small><strong>${q.reward.sparks} Sparks</strong></div><div class="resource-card"><small>MEMORY</small><strong>${q.reward.memory}</strong></div><div class="resource-card"><small>REPUTATION</small><strong>${q.reward.reputation}</strong></div><div class="resource-card"><small>SCORE</small><strong>${calcScore(storyState)}</strong></div></div><div class="play-controls">${mainAction}<button class="button outline" data-story-action="talk">NPC DIALOGUE</button><button class="button outline" data-story-action="ai">ASK HELPER</button></div><div class="section-title">DISTRICTS</div><div class="district-map">${districtGrid}</div>`; document.querySelectorAll<HTMLElement>('[data-story-action]').forEach(el=>el.addEventListener('click',()=>{const action=String(el.dataset.storyAction); if(action==='start')startQuest(q.id); else if(action==='talk')genericDialogue(q,status as 'locked'|'available'|'done'); else if(action==='ai')alert(explainQuest({id:'bridge',title:q.title,npc:q.npc,problem:q.summary,detail:q.beats,quote:q.summary,restoredQuote:q.worldEffect,reward:String(q.reward.sparks),symbol:'',issueHint:q.mechanic}));})); }
function renderAuxPanel(){const achievements=syncAchievements(storyState); const board=getLocalLeaderboard(); const slotButtons=[1,2,3].map(slot=>`<button class="slot-btn ${storyState.slot===slot?'active':''}" data-slot="${slot}">SLOT ${slot}</button>`).join(''); const inventory=storyState.inventory.map(x=>`<div class="inv-item"><strong>${escape(x)}</strong><small>Persistent story tool or keepsake.</small></div>`).join(''); const achieveHtml=achievements.map(a=>`<div class="achievement-item ${a.unlocked?'':'locked'}"><strong>${escape(a.title)}</strong><small>${escape(a.description)}</small></div>`).join(''); const boardHtml=board.map((b,i)=>`<div class="leaderboard-item ${b.profileId===storyState.profileId&&b.slot===storyState.slot?'current':''}"><strong>#${i+1} — ${escape(b.profileId)} / SLOT ${b.slot}</strong><small>Score ${b.score} · Main ${b.mainDone} · Side ${b.sideDone} · ${Math.floor(b.playTimeSeconds/60)} min</small></div>`).join('') || '<p>No local runs yet.</p>';
 const tabNav=`<div class="tabs"><button class="tab-btn ${storyTab==='overview'?'active':''}" data-tab="overview">OVERVIEW</button><button class="tab-btn ${storyTab==='inventory'?'active':''}" data-tab="inventory">INVENTORY</button><button class="tab-btn ${storyTab==='achievements'?'active':''}" data-tab="achievements">ACHIEVEMENTS</button><button class="tab-btn ${storyTab==='leaderboard'?'active':''}" data-tab="leaderboard">LEADERBOARD</button></div>`;
 const overview=`<div class="help-box">Playtime: ${Math.floor(storyState.playTimeSeconds/60)} min · Completed quests: ${allDone()}/48 · Ending: ${escape(storyState.endingChoice||'not chosen')}</div><div class="slot-row">${slotButtons}</div><div class="play-controls"><button class="button outline" data-slot-action="save">SAVE NOW</button><button class="button outline" data-slot-action="new">NEW SLOT</button><button class="button outline" data-slot-action="clear">CLEAR SLOT</button></div>`;
 $('proof-trail').innerHTML=tabNav + (storyTab==='overview'?overview:storyTab==='inventory'?`<div class="inv-list">${inventory||'<p>No items yet.</p>'}</div>`:storyTab==='achievements'?`<div class="achievement-list">${achieveHtml}</div>`:`<div class="leaderboard-list">${boardHtml}</div>`);
 document.querySelectorAll<HTMLElement>('[data-tab]').forEach(el=>el.addEventListener('click',()=>{storyTab=el.dataset.tab as StoryTab; renderAuxPanel();}));
 document.querySelectorAll<HTMLElement>('[data-slot]').forEach(el=>el.addEventListener('click',()=>switchSlot(Number(el.dataset.slot))));
 document.querySelectorAll<HTMLElement>('[data-slot-action]').forEach(el=>el.addEventListener('click',()=>{const action=String(el.dataset.slotAction); if(action==='save'){autosave(); notice('Story saved.'); renderAuxPanel();} else if(action==='new'){storyState=createNewSave(storyState.slot); selectedQuestId='CR-01'; ensureStoryProgress(); autosave(); renderStory(); notice('Started a fresh run in the current slot.');} else if(action==='clear'){clearSlot(storyState.slot); storyState=createNewSave(storyState.slot); selectedQuestId='CR-01'; ensureStoryProgress(); autosave(); renderStory(); notice('Slot cleared and restarted.');}})); }
function renderStory(){ensureStoryProgress(); renderStoryHUD(); renderStoryList(); renderStoryDetail(); renderAuxPanel(); storyRenderer?.setDistrict(storyState.districtId); if(storyRenderer)$('world').addEventListener('mousemove',()=>{}); }

function liveBounty(id:BuildingId){return bounties.filter(b=>b.building_id===id).slice().reverse().find(b=>b.state!=='CANCELLED')||bounties.filter(b=>b.building_id===id).at(-1)||null;}
function liveStatus(id:BuildingId):LiveStatus|null{return liveBounty(id)?.state||null;}
function stateForArt(id:BuildingId){return mode==='live'?visualState(liveStatus(id)):'broken';}
function stateLabel(id:BuildingId){if(mode==='story')return 'STORY';const live=liveBounty(id);return live?live.state:id==='bridge'?'UNFUNDED':'STORY';}
function renderHUDLive(){const {paid,total}=healthLive(bounties);$('city-health').textContent=total?`${paid}/${total} LIVE`:'0 LIVE';$('live-repairs').textContent=String(paid);$('locked-total').textContent=bounties.length?`${yoctoToNear(bounties.filter(b=>b.state!=='PAID'&&b.state!=='CANCELLED').reduce((acc,b)=>acc+BigInt(b.reward_yocto),0n).toString())} Ⓝ`:'—';const worker=bounties.find(b=>b.worker===wallet.accountId&&b.state==='APPROVED');$('pending-reward').textContent=worker?`${yoctoToNear(worker.reward_yocto)} Ⓝ`:'—';}
function renderLiveList(){$('quest-count').textContent='04';$('quest-list').innerHTML=QUESTS.map(q=>`<button class="quest-item ${selectedLive===q.id?'selected':''}" data-quest="${q.id}" role="listitem" aria-pressed="${selectedLive===q.id}"><span class="quest-symbol"><strong>${escape(q.title.split(' ')[1]||q.title)}</strong><span class="quest-kind">LIVE</span></span><span><h3>${escape(q.title)}</h3><small>${escape(q.npc)} · ${q.id==='bridge'?'REAL FLOW':'STORY ONLY'}</small></span><span class="right ${stateLabel(q.id)==='PAID'?'paid':''}">${escape(stateLabel(q.id))}</span></button>`).join('');document.querySelectorAll<HTMLElement>('[data-quest]').forEach(btn=>btn.addEventListener('click',()=>selectLive(btn.dataset.quest as BuildingId,true)));}
function selectLive(id:BuildingId,walk=false){selectedLive=id;liveRenderer!.selected=id;if(walk)liveRenderer!.goTo(id);evidence=null;renderLiveList();renderLiveDetails();}
function getStatusView(b:Bounty){const r=yoctoToNear(b.reward_yocto);return `<dl class="metadata"><dt>STATUS</dt><dd class="status-line">${escape(b.state)}</dd><dt>BOUNTY ID</dt><dd>#${b.id}</dd><dt>REWARD</dt><dd>${r} TESTNET Ⓝ</dd><dt>STORAGE</dt><dd>${yoctoToNear(b.storage_reserve_yocto)} Ⓝ</dd><dt>MAINTAINER</dt><dd>${escape(b.maintainer)}</dd><dt>PATCHER</dt><dd>${escape(b.worker||'Unclaimed')}</dd><dt>GITHUB</dt><dd>${escape(b.repo)}#${b.issue_number}</dd><dt>PR</dt><dd>${b.pr_url?`<a href="${escape(b.pr_url)}" target="_blank" rel="noopener noreferrer">Open submitted PR ↗</a>`:'Not submitted'}</dd></dl>`;}
function renderLiveDetails(){const q=QUESTS.find(x=>x.id===selectedLive)!; const isSample=q.id!=='bridge'; const status=q.id==='bridge'?liveStatus('bridge'):'SAMPLE'; const repaired=status==='PAID'; let html=`<span class="tag ${isSample?'sample':repaired?'paid':''}">${isSample?'STORY/SAMPLE':'NEAR TESTNET'}</span><h3>${escape(q.title)}</h3><span class="eyebrow">${escape(q.npc)} / ${escape(q.issueHint)}</span><div class="quest-quote">“${escape(repaired?q.restoredQuote:q.quote)}”</div><p>${escape(q.problem)}</p>`;
 if(isSample){html+=`<p>Story mode now owns the big campaign. This panel remains as the truthful live bounty board for the Bridge flow.</p><div class="action-stack"><a class="button primary" href="/sample">OPEN STORY MODE</a></div>`;}
 else{const bounty=liveBounty('bridge'); if(!config.contractId){html+=`<p class="disclaimer">Live unavailable — no deployed contract configured.</p>`;} else if(error){html+=`<p class="disclaimer">RPC unavailable: ${escape(error)}</p>`;} else if(!bounty){if(wallet.accountId){html+=`<div class="input-group"><label for="issue-url">PUBLIC GITHUB ISSUE</label><input id="issue-url" placeholder="https://github.com/owner/repo/issues/1" value="${escape(config.issueUrl)}"></div><div class="input-group"><label for="amount">TESTNET REWARD (Ⓝ)</label><input id="amount" value="0.05" inputmode="decimal"></div><div class="action-stack"><button class="button primary" data-action="create">FUND REAL BOUNTY</button></div>`;} else html+=`<button class="button primary" data-action="connect">CONNECT TO FUND</button>`;}
 else{html+=getStatusView(bounty)+`<div class="action-stack"><a class="button outline" href="https://github.com/${escape(bounty.repo)}/issues/${bounty.issue_number}" target="_blank" rel="noopener noreferrer">OPEN ISSUE ↗</a><button class="button outline" data-action="ai">ASK AI ENGINEER</button></div>`;
 if(!wallet.accountId)html+=`<button class="button outline" data-action="connect">CONNECT WALLET</button>`;
 else if(bounty.state==='OPEN'){if(bounty.maintainer===wallet.accountId)html+=`<button class="button outline" data-action="cancel">CANCEL BOUNTY</button>`;else html+=`<button class="button primary" data-action="claim">CLAIM QUEST</button>`;}
 else if(bounty.state==='CLAIMED'&&bounty.worker===wallet.accountId)html+=`<div class="input-group"><label for="pr-url">PULL REQUEST URL</label><input id="pr-url" placeholder="https://github.com/owner/repo/pull/2"></div><div class="action-stack"><button class="button outline" data-action="check-evidence">CHECK EVIDENCE</button><button class="button primary" data-action="submit">SUBMIT PATCH</button></div>`;
 else if(bounty.state==='SUBMITTED'&&bounty.maintainer===wallet.accountId)html+=`<div class="action-stack"><button class="button outline" data-action="check-evidence">VALIDATE PR EVIDENCE</button></div><label class="input-help"><input id="human-review" type="checkbox"> I personally reviewed the patch.</label><div class="action-stack"><button class="button primary" data-action="approve">APPROVE PATCH</button></div>`;
 else if(bounty.state==='APPROVED'&&bounty.worker===wallet.accountId)html+=`<button class="button primary" data-action="withdraw">WITHDRAW REWARD</button>`;
 else if(bounty.state==='PAID')html+=`<p class="status-line">PATCH COMPLETE — confirmed PAID.</p>`;
 if(evidence&&evidence.prUrl===bounty.pr_url)html+=`<p class="input-help">GITHUB: ${escape(evidence.status)} · CI ${escape(evidence.ci)} · SHA ${escape(evidence.headSha.slice(0,10))}</p>`; }}
 $('quest-detail').innerHTML=html; document.querySelectorAll<HTMLElement>('[data-action]').forEach(btn=>btn.addEventListener('click',()=>void performLive(btn.dataset.action!))); renderProof(); }
function renderProof(){if(mode!=='live'){ $('proof-trail').innerHTML=''; return; } const b=liveBounty('bridge'); let html='<h3>PROOF TRAIL</h3>'; if(!config.contractId)html+='<p>CONTRACT: NOT DEPLOYED</p>'; else {html+=`<div class="proof-entry">CONTRACT: ${escape(config.contractId)}</div>`; if(b)html+=`<div class="proof-entry">BOUNTY #${b.id}: ${escape(b.state)}</div><div class="proof-entry">PR SHA: ${escape(b.commit_sha||'—')}</div><div class="proof-entry">PAYOUT: ${b.state==='PAID'?'CONFIRMED':'NOT PAID'}</div>`;} for(const t of txRecord)html+=`<div class="proof-entry">${escape(t.method)}: <a href="${escape(explorerTx(t.hash))}" rel="noopener noreferrer" target="_blank">${escape(t.hash.slice(0,12))}… ↗</a></div>`; $('proof-trail').innerHTML=html; }
async function refresh(){if(mode!=='live')return;if(!config.contractId){error='';renderLive();return}loading=true;notice('Reading the NEAR Testnet contract...');try{bounties=await getBounties(config);error='';notice(`Contract response confirmed: ${bounties.length} live bounties.`)}catch(e){error=e instanceof Error?e.message:String(e);bounties=[];notice(`RPC failed: ${error}`)}finally{loading=false;renderLive();}}
async function performLive(action:string){if(action==='connect'){await connect();return}if(action==='ai'){alert(explainQuest(QUESTS.find(q=>q.id===selectedLive)!));return} if(loading||error){notice('Refresh live state before sending transactions.');return} const b=liveBounty('bridge'); if(!wallet.accountId){notice('Connect a wallet to change contract state.');return}
 try{let method='',args:Record<string,unknown>={},deposit='0'; if(action==='create'){const i=($('issue-url') as HTMLInputElement).value.trim(); const issue=parseGitHubIssue(i); await verifyIssue(i); deposit=(BigInt(decimalNearToYocto(($('amount') as HTMLInputElement).value.trim()))+BigInt(STORAGE_RESERVE_YOCTO)).toString(); args={repo:issue.repo,issue_number:issue.number,title:'The Broken Bridge',building_id:'bridge',reward_yocto:decimalNearToYocto(($('amount') as HTMLInputElement).value.trim())}; method='create_bounty';}
 else {if(!b)throw Error('Bounty missing, refresh state'); args={id:b.id}; if(action==='claim')method='claim_bounty'; else if(action==='cancel')method='cancel_bounty'; else if(action==='check-evidence'){const url=b.pr_url||(($('pr-url') as HTMLInputElement)?.value||''); evidence=await checkPR(url,b.repo,b.issue_number); notice(`${evidence.status}: merged=${evidence.merged}, CI=${evidence.ci}, linked issue=${evidence.linkedIssue}.`); return;} else if(action==='submit'){const url=($('pr-url') as HTMLInputElement).value.trim(); evidence=await checkPR(url,b.repo,b.issue_number); args={id:b.id,pr_url:evidence.prUrl,commit_sha:evidence.headSha,evidence_sha256:await hashEvidence(evidence,b.issue_number)}; method='submit_patch'} else if(action==='approve'){if(!($('human-review') as HTMLInputElement).checked)throw Error('Check the manual review box first.'); evidence=await checkPR(b.pr_url||'',b.repo,b.issue_number); if(evidence.status!=='READY_FOR_MANUAL_REVIEW')throw Error(`Approval blocked: ${evidence.status}.`); method='approve_patch'} else if(action==='withdraw'){method='withdraw_reward'; args={}} else throw Error(`Unsupported action ${action}`)}
 notice('Waiting for wallet confirmation...'); const out=await wallet.change(config,method,args,deposit); const hash=(out as {transaction?:{hash?:string}}|null)?.transaction?.hash; if(hash&&typeof hash==='string')txRecord.push({method,hash}); notice('Wallet returned. Checking NEAR contract state...'); await refresh(); }catch(e){notice(`Action not completed: ${e instanceof Error?e.message:String(e)}`)} }
function renderLive(){renderHUDLive(); renderLiveList(); renderLiveDetails(); $('intro').hidden=true; $('mode-badge').textContent='LIVE TESTNET'; $('stage-title').textContent='The city needs a real patch.'; $('stage-subtitle').textContent='Story mode is offline and generous. Live mode only changes on verified on-chain state.'; $('panel-intro').textContent='The Bridge bounty is the truthful NEAR flow. No fake on-chain progress is shown here.';}
async function connect(){try{notice('Connecting to a NEAR Testnet wallet...');await wallet.connect(config);if(wallet.accountId)notice(`Connected: ${wallet.accountId}`);}catch(e){notice(`Wallet unavailable: ${e instanceof Error?e.message:String(e)}`);} }

function renderHome(){ $('intro').hidden=false; $('mode-badge').textContent='HOME'; $('stage-title').textContent='A broken city, rebuilt quest by quest.'; $('stage-subtitle').textContent='Story mode is a full pixel campaign. Live mode keeps the honest contract-backed patch loop.'; $('quest-list').innerHTML=''; $('quest-detail').innerHTML='<h3>Choose your path</h3><p>Story mode contains four districts, main and side quests, puzzles, inventory, achievements and local save slots. Live mode retains the NEAR Testnet bounty flow for the Bridge quest.</p><div class="play-controls"><a class="button primary" href="/sample">START STORY</a><a class="button outline" href="/live">OPEN LIVE BOARD</a></div>'; $('proof-trail').innerHTML=''; $('city-health').textContent='4 DISTRICTS'; $('live-repairs').textContent='48 QUESTS'; $('locked-total').textContent='6 PUZZLES'; $('pending-reward').textContent='LOCAL + LIVE'; }
function renderAbout(){ $('intro').hidden=true; $('mode-badge').textContent='ABOUT'; $('stage-title').textContent='How THE LAST PATCH works'; $('stage-subtitle').textContent='A local campaign for play, plus a separate live board for real testnet payouts.'; $('quest-list').innerHTML=''; $('quest-detail').innerHTML='<h3>System split</h3><ul><li>Story mode works offline without wallet or GitHub.</li><li>Live mode reads NEAR RPC and requires signed actions.</li><li>Local leaderboard is clearly marked local-only.</li><li>On-chain rewards are separate from Sparks and local progress.</li></ul>'; $('proof-trail').innerHTML=''; $('city-health').textContent='STORY + LIVE'; $('live-repairs').textContent='HONEST'; $('locked-total').textContent='NEAR'; $('pending-reward').textContent='PIXEL'; }

async function init(){
  try{const response=await fetch('/config.json',{cache:'no-store'}); if(response.ok){const x=await response.json() as Partial<Config>; config={...config,...x,network:'testnet'};}}catch{}
  assets=new AssetRegistry(); await assets.load();
  const canvas=$('world') as HTMLCanvasElement;
  if(mode==='story'){
    storyRenderer=new StoryRenderer(canvas,assets,storyView); storyRenderer.onInteract=handleHotspot; requestAnimationFrame(storyRenderer.render);
    canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*640/rect.width,y=(e.clientY-rect.top)*360/rect.height; storyRenderer?.moveClick(x,y);});
    window.addEventListener('keydown',e=>{if(modal.classList.contains('hidden')===false && e.key==='Escape'){closeModal();return;} if(['ArrowLeft','ArrowUp'].includes(e.key)){storyRenderer?.focus(-1); renderStory();} else if(['ArrowRight','ArrowDown'].includes(e.key)){storyRenderer?.focus(1); renderStory();} else if(e.key==='Enter' || e.key===' '){storyRenderer?.activateFocused();}});
    playTimer=window.setInterval(()=>{storyState.playTimeSeconds+=1; if(storyState.playTimeSeconds%20===0)autosave();},1000);
    renderStory();
  } else {liveRenderer=new WorldRenderer(canvas,assets,(id)=>mode==='live'?visualState(liveStatus(id)):stateForArt(id)); liveRenderer.onArrival=id=>selectLive(id); requestAnimationFrame(liveRenderer.render); canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)*640/rect.width,y=(e.clientY-rect.top)*360/rect.height; const id=liveRenderer?.moveClick(x,y); if(id)notice(`Walking toward ${QUESTS.find(q=>q.id===id)?.title}.`);}); if(mode==='live')await refresh(); else if(mode==='home')renderHome(); else renderAbout(); }
  $('refresh').addEventListener('click',()=>mode==='live'?void refresh():renderStory()); $('wallet-button').addEventListener('click',()=>wallet.accountId?void wallet.disconnect():void connect()); wallet.onChange=()=>{$('wallet-button').textContent=wallet.accountId?(wallet.accountId.length>20?wallet.accountId.slice(0,17)+'…':wallet.accountId):'CONNECT WALLET'; if(mode==='live')renderLive();};
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(a=>a.classList.toggle('active',a.dataset.route=== (mode==='home'?'/':mode==='story'?'/sample':mode==='live'?'/live':location.pathname)));
  try{const online=await rpcHealth(config); $('network-status').textContent=online?'RPC ONLINE':'RPC OFFLINE'; $('network-status').className='network-status '+(online?'ready':'error');}catch{$('network-status').textContent='RPC OFFLINE'; $('network-status').className='network-status error';}
  if(mode==='live'&&config.contractId)try{await wallet.init(config);}catch(e){notice(`Wallet module unavailable: ${String(e)}`);} 
  if(location.search.includes('transactionHashes=')){const hashes=new URLSearchParams(location.search).get('transactionHashes')||''; for(const hash of hashes.split(',')){if(/^[A-Za-z0-9]{40,60}$/.test(hash))txRecord.push({method:'Wallet redirect (verify on-chain)',hash});} renderProof(); history.replaceState(null,'',location.pathname);}
}
void init().catch(e=>{console.error('Failed to initialize game:',e); notice('Game failed to initialize; refresh the page.');});
