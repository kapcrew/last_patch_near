export type DistrictId='crossing'|'lantern'|'archive'|'foundry';
export type QuestKind='main'|'side';
export type QuestProgress='locked'|'available'|'tracking'|'done';
export type PuzzleFamily='diff'|'dependency'|'nullflow'|'signature'|'clock'|'relay'|'choice';
export interface QuestReward{sparks:number;memory:number;reputation:number;item?:string}
export interface CampaignQuest{
  id:string;kind:QuestKind;district:DistrictId;title:string;npc:string;mechanic:string;puzzleFamily:PuzzleFamily;
  prerequisite:string[];beats:string;success:string;worldEffect:string;minutes:number;reward:QuestReward;summary:string;
}
export interface Achievement{id:string;title:string;description:string;unlocked:boolean}
export interface DialogueEntry{speaker:string;text:string}
export interface StoryState{
  schemaVersion:number;profileId:string;slot:number;createdAt:number;updatedAt:number;chapterId:string;districtId:DistrictId;
  activeQuestId:string|null;questStates:Record<string,QuestProgress>;worldFlags:Record<string,boolean>;inventory:string[];
  resources:{sparks:number;memory:number;reputation:number;relics:number};dialogueSeen:string[];achievements:string[];
  playTimeSeconds:number;endingChoice:string|null;sideQuestStates:Record<string,QuestProgress>;settings:{music:boolean;keyboardHints:boolean};
}
export interface SaveEnvelope{save:StoryState;checksum:string}
export interface LeaderboardEntry{profileId:string;score:number;mainDone:number;sideDone:number;playTimeSeconds:number;updatedAt:number;slot:number}
export interface DistrictInfo{id:DistrictId;title:string;subtitle:string;accent:string;unlockFrom:string|null;mainQuestIds:string[];sideQuestIds:string[]}
