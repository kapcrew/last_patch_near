const ORDER = ['crossing', 'lantern', 'archive', 'foundry'];
const DISTRICT_HOTSPOTS = {
    crossing: [
        { id: 'npc-mira', label: 'Mira', type: 'npc', x: 118, y: 214, w: 28, h: 40, questIds: ['CR-01', 'S-02'], npcName: 'Mira the Cartographer', sprite: 'npc:archer' },
        { id: 'bridge', label: 'Broken Bridge', type: 'quest', x: 280, y: 232, w: 94, h: 56, questIds: ['CR-02', 'CR-06', 'S-04'], sprite: 'prop:building-bridge' },
        { id: 'well', label: 'Silent Well', type: 'quest', x: 74, y: 145, w: 85, h: 95, questIds: ['CR-03', 'CR-05', 'S-01'], sprite: 'prop:building-well' },
        { id: 'npc-pip', label: 'Courier', type: 'npc', x: 430, y: 236, w: 28, h: 40, questIds: ['CR-04', 'CR-07', 'S-03'], npcName: 'Pip the Courier', sprite: 'npc:pawn' },
        { id: 'gate-lantern', label: 'Gate to Lantern Quarter', type: 'gate', x: 548, y: 118, w: 72, h: 74, target: 'lantern', sprite: 'prop:house-red' }
    ],
    lantern: [
        { id: 'npc-edda', label: 'Edda', type: 'npc', x: 164, y: 220, w: 28, h: 40, questIds: ['LQ-01', 'LQ-03', 'S-05'], npcName: 'Edda the Innkeeper', sprite: 'npc:monk' },
        { id: 'market', label: 'Market', type: 'quest', x: 76, y: 140, w: 96, h: 90, questIds: ['LQ-02', 'LQ-04', 'S-06'], sprite: 'prop:house-blue' },
        { id: 'signal-board', label: 'Lantern Board', type: 'quest', x: 298, y: 184, w: 56, h: 70, questIds: ['LQ-05', 'LQ-06', 'S-07'], sprite: 'prop:fountain' },
        { id: 'npc-rook', label: 'Rook', type: 'npc', x: 456, y: 218, w: 28, h: 40, questIds: ['LQ-07', 'LQ-08', 'S-08'], npcName: 'Rook the Carpenter', sprite: 'npc:warrior' },
        { id: 'gate-archive', label: 'Archive Gate', type: 'gate', x: 536, y: 114, w: 76, h: 76, target: 'archive', sprite: 'prop:building-library' }
    ],
    archive: [
        { id: 'npc-lys', label: 'Lys', type: 'npc', x: 102, y: 228, w: 28, h: 40, questIds: ['AR-01', 'AR-03', 'S-09'], npcName: 'Lys the Librarian', sprite: 'npc:archer' },
        { id: 'library', label: 'Dark Library', type: 'quest', x: 198, y: 96, w: 138, h: 150, questIds: ['AR-02', 'AR-04', 'S-10', 'S-11'], sprite: 'prop:building-library' },
        { id: 'shade', label: 'Archivist Shade', type: 'npc', x: 398, y: 212, w: 28, h: 40, questIds: ['AR-05', 'AR-06', 'S-12'], npcName: 'The Archivist Shade', sprite: 'npc:pawn' },
        { id: 'garden-fountain', label: 'Reflection Pool', type: 'quest', x: 500, y: 192, w: 72, h: 72, questIds: ['AR-07', 'AR-08'], sprite: 'prop:fountain' },
        { id: 'gate-foundry', label: 'Foundry Lift', type: 'gate', x: 546, y: 110, w: 64, h: 70, target: 'foundry', sprite: 'prop:alchemy' }
    ],
    foundry: [
        { id: 'npc-fox', label: 'Iron Fox', type: 'npc', x: 154, y: 222, w: 28, h: 40, questIds: ['FR-01', 'FR-02', 'S-13', 'S-14'], npcName: 'Iron Fox', sprite: 'npc:warrior' },
        { id: 'forge', label: 'Sleeping Forge', type: 'quest', x: 290, y: 120, w: 160, h: 170, questIds: ['FR-03', 'FR-04', 'FR-05', 'S-15'], sprite: 'prop:building-forge' },
        { id: 'assembly', label: 'Assembly Table', type: 'quest', x: 92, y: 160, w: 82, h: 70, questIds: ['FR-06'], sprite: 'prop:alchemy' },
        { id: 'finale', label: 'Beacon', type: 'quest', x: 500, y: 174, w: 70, h: 88, questIds: ['FR-07', 'FR-08', 'S-16'], sprite: 'prop:city-heart' },
        { id: 'gate-crossing', label: 'Return to Crossing', type: 'gate', x: 28, y: 112, w: 70, h: 72, target: 'crossing', sprite: 'prop:building-bridge' }
    ]
};
export class StoryRenderer {
    canvas;
    assets;
    getView;
    ctx;
    last = performance.now();
    pulse = 0;
    route = [];
    currentTarget = null;
    hovered = null;
    player = { x: 320, y: 300 };
    districtId = 'crossing';
    focusIndex = 0;
    onInteract = () => { };
    constructor(canvas, assets, getView) {
        this.canvas = canvas;
        this.assets = assets;
        this.getView = getView;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw Error('Canvas unavailable');
        this.ctx = ctx;
        ctx.imageSmoothingEnabled = false;
    }
    hotspots() { return DISTRICT_HOTSPOTS[this.districtId]; }
    setDistrict(id) { if (this.districtId !== id) {
        this.districtId = id;
        this.focusIndex = 0;
        const start = { crossing: [124, 302], lantern: [118, 302], archive: [112, 302], foundry: [96, 302] }[id];
        this.player.x = start[0];
        this.player.y = start[1];
        this.route = [];
    } }
    focus(step) { const hs = this.hotspots(); this.focusIndex = (this.focusIndex + step + hs.length) % hs.length; return hs[this.focusIndex]; }
    activateFocused() { const hs = this.hotspots()[this.focusIndex]; if (hs)
        this.goTo(hs); }
    moveClick(x, y) { const hit = this.hotspots().find(h => x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h); if (hit) {
        this.goTo(hit);
        return hit;
    } this.route = [[x, y]]; return null; }
    goTo(h) { this.currentTarget = h; this.route = [[h.x + h.w / 2, h.y + h.h + 18]]; }
    update(dt) {
        let remaining = Math.min(dt, 0.05) * 90;
        while (this.route.length && remaining > 0) {
            const [x, y] = this.route[0];
            const dx = x - this.player.x, dy = y - this.player.y, d = Math.hypot(dx, dy);
            if (d <= remaining) {
                this.player.x = x;
                this.player.y = y;
                this.route.shift();
                remaining -= d;
            }
            else {
                this.player.x += dx / d * remaining;
                this.player.y += dy / d * remaining;
                remaining = 0;
            }
        }
        if (!this.route.length && this.currentTarget) {
            const t = this.currentTarget;
            this.currentTarget = null;
            this.onInteract(t);
        }
    }
    render = (now) => { const dt = Math.max(0, (now - this.last) / 1000); this.last = now; this.pulse += dt; this.update(dt); this.draw(); requestAnimationFrame(this.render); };
    fill(x, y, w, h, color) { this.ctx.fillStyle = color; this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    drawImage(key, x, y, w, h) { const img = this.assets.get(key); if (img)
        this.ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
    drawSprite(sheetKey, x, y, w, h, cols, rows) { const img = this.assets.get(sheetKey); if (!img)
        return; const frame = Math.floor(this.pulse * 4) % Math.min(2, cols); const sw = img.width / cols, sh = img.height / rows; this.ctx.drawImage(img, frame * sw, 0, sw, sh, Math.round(x), Math.round(y), w, h); }
    drawTerrain() {
        const c = this.ctx;
        c.clearRect(0, 0, 640, 360);
        c.imageSmoothingEnabled = false;
        const bg = this.assets.get(this.districtId === 'crossing' ? 'bg:crossing' : 'background');
        if (bg && this.districtId === 'crossing') {
            c.drawImage(bg, 0, 0, 640, 360);
        }
        else {
            const sky = { crossing: '#273e72', lantern: '#59355f', archive: '#384263', foundry: '#5c3b36' }[this.districtId];
            this.fill(0, 0, 640, 360, sky);
            this.fill(0, 170, 640, 190, { crossing: '#4d735f', lantern: '#52634b', archive: '#445469', foundry: '#695046' }[this.districtId]);
        }
        // water/path accents
        if (this.districtId === 'crossing') {
            this.fill(278, 0, 86, 360, '#3b6a9e');
            this.fill(0, 286, 640, 74, '#446e5c');
        }
        if (this.districtId === 'lantern') {
            this.fill(0, 286, 640, 74, '#536848');
            for (let i = 0; i < 5; i++)
                this.fill(68 + i * 110, 165, 6, 42, '#ffd391');
        }
        if (this.districtId === 'archive') {
            this.fill(0, 286, 640, 74, '#475162');
            this.fill(480, 182, 94, 54, '#4f7eb0');
        }
        if (this.districtId === 'foundry') {
            this.fill(0, 286, 640, 74, '#5f4a40');
            this.fill(0, 180, 640, 10, '#805544');
        }
        for (let i = 0; i < 9; i++)
            this.drawImage(`prop:${i % 2 ? 'tree1' : 'tree2'}`, 20 + i * 70, 85 + (i % 3) * 8, 34, 52);
        for (let i = 0; i < 10; i++)
            this.drawImage(`prop:${i % 2 ? 'bush1' : 'bush2'}`, 15 + i * 62, 262 + (i % 2) * 12, 24, 20);
        for (let i = 0; i < 7; i++)
            this.fill(44 + i * 88, 278, 60, 7, '#b88a63');
    }
    drawDistrictLandmarks(view) {
        const progress = view.districtProgress;
        const stage = progress >= 100 ? 'restored' : progress >= 45 ? 'progress' : 'broken';
        if (this.districtId === 'crossing') {
            this.drawImage(`prop:building-well-${stage}`, 62, 130, 118, 118);
            this.drawImage(`prop:building-bridge-${stage}`, 262, 214, 118, 86);
            this.drawSprite('npc:archer', 116, 214, 30, 36, 4, 4);
            this.drawSprite('npc:pawn', 430, 236, 30, 36, 4, 4);
        }
        else if (this.districtId === 'lantern') {
            this.drawImage('prop:house-red', 74, 140, 96, 96);
            this.drawImage('prop:house-blue', 206, 152, 92, 92);
            this.drawImage('prop:fountain', 294, 184, 58, 68);
            this.drawImage('prop:building-library-progress', 534, 110, 82, 82);
            this.drawSprite('npc:monk', 164, 220, 30, 36, 4, 4);
            this.drawSprite('npc:warrior', 456, 218, 30, 36, 4, 4);
        }
        else if (this.districtId === 'archive') {
            this.drawImage(`prop:building-library-${stage}`, 182, 96, 156, 160);
            this.drawImage('prop:monastery', 510, 70, 82, 136);
            this.drawImage('prop:fountain', 500, 192, 72, 72);
            this.drawSprite('npc:archer', 102, 228, 30, 36, 4, 4);
            this.drawSprite('npc:pawn', 398, 212, 30, 36, 4, 4);
        }
        else if (this.districtId === 'foundry') {
            this.drawImage(`prop:building-forge-${stage}`, 276, 108, 182, 182);
            this.drawImage('prop:alchemy', 96, 132, 92, 128);
            this.drawImage('prop:city-heart', 500, 176, 76, 92);
            this.drawSprite('npc:warrior', 154, 222, 30, 36, 4, 4);
            if (progress >= 70) {
                this.fill(340, 170, 30, 32, '#ffb667');
                this.fill(350, 150, 10, 22, '#ffd391');
            }
        }
        const gate = this.hotspots().find(x => x.type === 'gate');
        if (gate)
            this.drawImage(gate.sprite ? gate.sprite.replace('prop:', 'prop:') : 'prop:house-red', gate.x, gate.y, gate.w, gate.h);
    }
    drawHotspots() {
        const c = this.ctx;
        this.hotspots().forEach((h, idx) => { const focused = idx === this.focusIndex; const activePulse = Math.floor(this.pulse * 5) % 2 === 0; if (focused || this.hovered === h.id) {
            c.strokeStyle = focused ? '#ffe6b8' : '#c7d7ff';
            c.lineWidth = 2;
            c.strokeRect(h.x - 2, h.y - 2, h.w + 4, h.h + 4);
        } if (h.type !== 'gate' && activePulse) {
            this.fill(h.x + h.w / 2 - 5, h.y - 10, 10, 5, '#151d35');
            this.fill(h.x + h.w / 2 - 2, h.y - 7, 4, 2, '#ffd391');
        } });
    }
    drawPlayer() { this.drawSprite('sprite:player', this.player.x - 16, this.player.y - 32, 32, 48, 4, 4); this.fill(this.player.x - 9, this.player.y + 13, 18, 4, '#1c2647'); }
    drawCaption(view) { const hs = this.hotspots()[this.focusIndex]; this.fill(8, 8, 220, 42, 'rgba(8,10,22,0.76)'); this.ctx.strokeStyle = view.worldFlags[this.districtId + 'Restored'] ? '#a7ecc4' : '#ffd391'; this.ctx.strokeRect(8, 8, 220, 42); this.ctx.fillStyle = '#f6f1e0'; this.ctx.font = 'bold 12px monospace'; this.ctx.fillText(ORDER.indexOf(this.districtId) + 1 + '. ' + this.districtId.toUpperCase(), 16, 24); this.ctx.font = '10px monospace'; this.ctx.fillStyle = '#c9d2eb'; this.ctx.fillText(`Track: ${view.trackedQuestLabel.slice(0, 28)}`, 16, 38); if (hs) {
        this.fill(432, 8, 200, 42, 'rgba(8,10,22,0.76)');
        this.ctx.strokeStyle = '#58658d';
        this.ctx.strokeRect(432, 8, 200, 42);
        this.ctx.fillStyle = '#f6f1e0';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillText(hs.label, 440, 24);
        this.ctx.fillStyle = '#c9d2eb';
        this.ctx.font = '10px monospace';
        this.ctx.fillText('Enter / click to interact', 440, 38);
    } }
    draw() { const view = this.getView(); this.setDistrict(view.districtId); this.drawTerrain(); this.drawDistrictLandmarks(view); this.drawHotspots(); this.drawPlayer(); this.drawCaption(view); }
}
