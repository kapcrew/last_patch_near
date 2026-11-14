# Adding custom artwork from Pixudi, Starfall or new illustrations

The new illustration `public/media/twilight-city.png` was generated specifically for THE LAST PATCH and used as the background. The full-res original is `art-source/twilight-city-original.png` and can be replaced independently of contract/game state.

`public/assets/manifest.json` is the single wiring point for images. Optional files: `bridge-broken.png`, `bridge-progress.png`, `bridge-restored.png` (same for well/library/forge), `characters/patchkeeper-idle.png`, `npc/bridgekeeper.png`, etc. Asset URLs may point to your verified local files. `AssetRegistry` tries to decode them; if missing or corrupt, it logs a warning and uses the procedural renderer. **No missing art prevents a quest or wallet transaction.**

- Recommended building exports: transparent PNG with consistent dimensions, aligned around visual bounding boxes. Logical coordinate system is 640×360; a 16×16 tile grid remains recommended. Pixel art should be resized using `nearest` only.
- Buildings are placed in `src/game/WorldRenderer.ts` under `SITES` with `{x,y,w,h,entry}`. Entrance hotspots, path waypoints and UI logic are independent of filenames. Do not rename `building_id` keys on the contract just to change art.
- Keep three variants for bridge (BROKEN, PROGRESS, RESTORED). Live state must still be mapped exclusively by `visualState()` to avoid visually claiming payout before NEAR callback.
- If adding Pixudi or Starfall sprites, first verify ownership or use permissions and note exact asset source + license in this file. The reference ZIP archives were inspected but **not copied into this standalone release**.
- New characters/animations must not embed trademarks, protected game characters or other projects' source code without permission.
