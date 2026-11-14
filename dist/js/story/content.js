import { MAIN_QUESTS, SIDE_QUESTS } from './generatedContent.js';
export const DISTRICTS = [
    { id: 'crossing', title: 'Fractured Crossing', subtitle: 'Where the town first learns to breathe again.', accent: '#ffd391', unlockFrom: null, mainQuestIds: MAIN_QUESTS.filter(q => q.district === 'crossing').map(q => q.id), sideQuestIds: SIDE_QUESTS.filter(q => q.district === 'crossing').map(q => q.id) },
    { id: 'lantern', title: 'Lantern Quarter', subtitle: 'Homes, inns and market lanes lit by repaired signals.', accent: '#f7c773', unlockFrom: 'CR-07', mainQuestIds: MAIN_QUESTS.filter(q => q.district === 'lantern').map(q => q.id), sideQuestIds: SIDE_QUESTS.filter(q => q.district === 'lantern').map(q => q.id) },
    { id: 'archive', title: 'Archive Gardens', subtitle: 'A haunted library district wrapped in paper and rain.', accent: '#a5c8ff', unlockFrom: 'LQ-07', mainQuestIds: MAIN_QUESTS.filter(q => q.district === 'archive').map(q => q.id), sideQuestIds: SIDE_QUESTS.filter(q => q.district === 'archive').map(q => q.id) },
    { id: 'foundry', title: 'Ashen Foundry', subtitle: 'Final fires, iron vows and the last patch.', accent: '#ffae8f', unlockFrom: 'AR-07', mainQuestIds: MAIN_QUESTS.filter(q => q.district === 'foundry').map(q => q.id), sideQuestIds: SIDE_QUESTS.filter(q => q.district === 'foundry').map(q => q.id) }
];
const familyFor = (mechanic) => {
    const x = mechanic.toLowerCase();
    if (x.includes('diff'))
        return 'diff';
    if (x.includes('dependency') || x.includes('route'))
        return 'dependency';
    if (x.includes('null'))
        return 'nullflow';
    if (x.includes('signature'))
        return 'signature';
    if (x.includes('clock') || x.includes('order'))
        return 'clock';
    if (x.includes('relay') || x.includes('signal'))
        return 'relay';
    return 'choice';
};
const sparkReward = (minutes, kind, memory) => kind === 'main' ? minutes * 3 + memory * 2 : minutes * 2 + 1;
const reputationReward = (district, kind) => kind === 'main' ? ({ crossing: 6, lantern: 8, archive: 10, foundry: 12 }[district]) : 3;
export const CAMPAIGN_QUESTS = [
    ...MAIN_QUESTS.map((q) => ({
        id: q.id, kind: 'main', district: q.district, title: q.title, npc: q.npc, mechanic: q.mechanic, puzzleFamily: familyFor(q.mechanic),
        prerequisite: q.prerequisite === 'START' ? [] : q.prerequisite.split('|').filter(Boolean), beats: q.beats, success: q.success, worldEffect: q.worldEffect, minutes: q.minutes,
        reward: { sparks: sparkReward(q.minutes, 'main', q.memoryFragments), memory: q.memoryFragments, reputation: reputationReward(q.district, 'main') },
        summary: q.success
    })),
    ...SIDE_QUESTS.map((q, index) => ({
        id: q.id, kind: 'side', district: q.district, title: q.title, npc: ['Mira the Cartographer', 'Old Bridgekeeper', 'Edda the Innkeeper', 'Lys the Librarian', 'Iron Fox'][index % 5],
        mechanic: ['Search & Select', 'Sequence Repair', 'Grid Pattern', 'Request Retry', 'Market Labels', 'Role Access'][index % 6], puzzleFamily: ['diff', 'clock', 'dependency', 'nullflow', 'signature', 'relay'][index % 6],
        prerequisite: [], beats: q.task, success: q.reward, worldEffect: q.reward, minutes: q.estimatedMinutes,
        reward: { sparks: sparkReward(q.estimatedMinutes, 'side', 0), memory: index % 4 === 0 ? 1 : 0, reputation: reputationReward(q.district, 'side') }, summary: q.task
    }))
];
export const QUEST_BY_ID = new Map(CAMPAIGN_QUESTS.map(q => [q.id, q]));
export const MAIN_IDS = CAMPAIGN_QUESTS.filter(q => q.kind === 'main').map(q => q.id);
export const SIDE_IDS = CAMPAIGN_QUESTS.filter(q => q.kind === 'side').map(q => q.id);
export const STARTING_QUEST_IDS = ['CR-01', 'S-01', 'S-02', 'S-03', 'S-04'];
export const ACHIEVEMENTS = [
    { id: 'first_patch', title: 'First Patch', description: 'Complete your first quest.', unlocked: false },
    { id: 'crossing_restored', title: 'Crossing Reborn', description: 'Finish the Fractured Crossing main arc.', unlocked: false },
    { id: 'lantern_restored', title: 'Lights Return', description: 'Restore the Lantern Quarter.', unlocked: false },
    { id: 'archive_restored', title: 'Stories Return', description: 'Restore the Archive Gardens.', unlocked: false },
    { id: 'foundry_restored', title: 'The Last Fire', description: 'Restore the Ashen Foundry.', unlocked: false },
    { id: 'side_hustler', title: 'Helping Hands', description: 'Finish 8 side quests.', unlocked: false },
    { id: 'memory_keeper', title: 'Memory Keeper', description: 'Collect 6 memory fragments.', unlocked: false },
    { id: 'grand_patch', title: 'The Last Patch', description: 'Finish the main campaign.', unlocked: false },
    { id: 'town_friend', title: 'Town Friend', description: 'Reach 100 reputation.', unlocked: false },
    { id: 'completionist', title: 'Completionist', description: 'Complete all 48 quests.', unlocked: false }
];
export function districtForQuest(id) { return QUEST_BY_ID.get(id)?.district ?? 'crossing'; }
export function nextDistrictId(current) { const order = ['crossing', 'lantern', 'archive', 'foundry']; return order[order.indexOf(current) + 1]; }
