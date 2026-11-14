import {ACHIEVEMENTS,CAMPAIGN_QUESTS,STARTING_QUEST_IDS} from './content.js';
import type {LeaderboardEntry,QuestProgress,SaveEnvelope,StoryState} from './types.js';

export const SCHEMA_VERSION=3;
const SAVE_KEY='tlp.save.v3.';const ACTIVE_SLOT_KEY='tlp.active-slot.v3';const LEADERBOARD_KEY='tlp.local-leaderboard.v3';
const now=()=>Date.now();
export const allQuestIds=CAMPAIGN_QUESTS.map(q=>q.id);
function checksum(value:string){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=(h*16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function id(){return Math.random().toString(36).slice(2,10);} 
export function emptyQuestStates():Record<string,QuestProgress>{return Object.fromEntries(allQuestIds.map(id=>[id,'locked' as QuestProgress]));}
export function createNewSave(slot:number):StoryState{const questStates=emptyQuestStates();for(const id of STARTING_QUEST_IDS)questStates[id]='available';return {schemaVersion:SCHEMA_VERSION,profileId:id(),slot,createdAt:now(),updatedAt:now(),chapterId:'prologue',districtId:'crossing',activeQuestId:'CR-01',questStates,worldFlags:{crossingUnlocked:true},inventory:['Lens','Patch Satchel'],resources:{sparks:12,memory:0,reputation:0,relics:0},dialogueSeen:[],achievements:[],playTimeSeconds:0,endingChoice:null,sideQuestStates:{},settings:{music:true,keyboardHints:true}};}
export function getActiveSlot(){const raw=localStorage.getItem(ACTIVE_SLOT_KEY);return raw&&/^[123]$/.test(raw)?Number(raw):1;}
export function setActiveSlot(slot:number){localStorage.setItem(ACTIVE_SLOT_KEY,String(slot));}
export function saveGame(save:StoryState){save.updatedAt=now();const payload=JSON.stringify(save);const env:SaveEnvelope={save,checksum:checksum(payload)};localStorage.setItem(SAVE_KEY+save.slot,JSON.stringify(env));setActiveSlot(save.slot);updateLocalLeaderboard(save);}
export function loadGame(slot:number):StoryState|null{const raw=localStorage.getItem(SAVE_KEY+slot);if(!raw)return null;try{const env=JSON.parse(raw) as SaveEnvelope;const payload=JSON.stringify(env.save);if(env.checksum!==checksum(payload))throw Error('checksum');return env.save;}catch{return null}}
export function loadOrCreate(slot:number){return loadGame(slot)??createNewSave(slot)}
export function clearSlot(slot:number){localStorage.removeItem(SAVE_KEY+slot)}
export function questCount(save:StoryState){const done=Object.values(save.questStates).filter(v=>v==='done').length;const total=allQuestIds.length;const mainDone=Object.entries(save.questStates).filter(([id,v])=>v==='done'&&!id.startsWith('S-')).length;const sideDone=done-mainDone;return {done,total,mainDone,sideDone};}
export function calcScore(save:StoryState){const {mainDone,sideDone}=questCount(save);return mainDone*100+sideDone*40+save.achievements.length*25+save.resources.sparks+save.resources.reputation*2+save.resources.memory*15;}
export function getLocalLeaderboard():LeaderboardEntry[]{try{return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)||'[]') as LeaderboardEntry[]}catch{return[]}}
export function updateLocalLeaderboard(save:StoryState){const board=getLocalLeaderboard().filter(x=>!(x.profileId===save.profileId&&x.slot===save.slot));const counts=questCount(save);board.push({profileId:save.profileId,slot:save.slot,score:calcScore(save),mainDone:counts.mainDone,sideDone:counts.sideDone,playTimeSeconds:save.playTimeSeconds,updatedAt:save.updatedAt});board.sort((a,b)=>b.score-a.score||a.playTimeSeconds-b.playTimeSeconds);localStorage.setItem(LEADERBOARD_KEY,JSON.stringify(board.slice(0,12)));}
export function syncAchievements(save:StoryState){const {mainDone,sideDone,done}=questCount(save);const a=new Set(save.achievements);if(done>=1)a.add('first_patch');if(mainDone>=8)a.add('crossing_restored');if(mainDone>=16)a.add('lantern_restored');if(mainDone>=24)a.add('archive_restored');if(mainDone>=32)a.add('foundry_restored');if(sideDone>=8)a.add('side_hustler');if(save.resources.memory>=6)a.add('memory_keeper');if(save.resources.reputation>=100)a.add('town_friend');if(mainDone>=32)a.add('grand_patch');if(done>=48)a.add('completionist');save.achievements=[...a];return ACHIEVEMENTS.map(x=>({...x,unlocked:a.has(x.id)}));}
