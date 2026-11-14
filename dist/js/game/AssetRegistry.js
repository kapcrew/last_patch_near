export class AssetRegistry {
    manifest = { version: 2, logicalTile: 16, fallback: 'procedural', entries: {} };
    assets = new Map();
    async load() {
        try {
            const response = await fetch('/assets/manifest.json');
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            this.manifest = await response.json();
        }
        catch (e) {
            console.warn('Asset manifest fallback: procedural', e);
        }
        const flat = [];
        if (this.manifest.background)
            flat.push({ key: 'background', url: this.manifest.background });
        for (const [k, v] of Object.entries(this.manifest.entries || {}))
            flat.push({ key: k, url: v });
        for (const [id, states] of Object.entries(this.manifest.sprites || {}))
            for (const [state, url] of Object.entries(states))
                flat.push({ key: `${id}:${state}`, url });
        for (const [id, url] of Object.entries(this.manifest.npcs || {}))
            flat.push({ key: `npc:${id}`, url });
        await Promise.all(flat.map(async ({ key, url }) => { try {
            const img = new Image();
            img.decoding = 'async';
            img.src = url;
            await img.decode();
            this.assets.set(key, img);
        }
        catch (e) {
            console.warn(`Sprite unavailable: ${key}`, e);
        } }));
    }
    get(key) { return this.assets.get(key) || null; }
}
