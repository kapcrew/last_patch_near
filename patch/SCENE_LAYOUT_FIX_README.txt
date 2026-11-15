THE LAST PATCH — VISUAL SCENE + QUESTBOOK FIX (15 Nov 2026)

What changed:
- Fractured Crossing: removed opaque vertical blue river / green ground overlays,
  repetitive flat path bars and artificial decoration on top of original pixel art.
- Replaced large object focus rectangles with small pixel beacons.
- Removed duplicate HTML canvas header overlays in Story Mode only.
- Questbook cards: readable MAIN/SIDE, puzzle family next to metadata, no
  letter-by-letter wrapping. District mini-map now stays inside its panel.
- Improved tablet/mobile navigation and small-screen spacing.
- Kept English-only campaign content and multi-bounty board from previous update.
- Unchanged NEAR contract, wallet, RPC, bounty behavior, GitHub code, saves.

INSTALL (Mac):
1. Stop running server with Ctrl+C.
2. cd "/Users/alexdarkwing/Downloads/the-last-patch 2"
3. unzip -o ~/Downloads/THE_LAST_PATCH_SCENE_LAYOUT_FIX.zip -d .
4. export CONTRACT_ID=lastpatch.intent.testnet
5. export NEAR_RPC=https://rpc.testnet.fastnear.com
6. npm test
7. npm start
8. Open http://localhost:8080/sample (Cmd+Shift+R to bypass cached files).
If hosted elsewhere, re-upload updated dist/ to that service.

VALIDATION:
- TypeScript build and 23/23 automated tests: PASSED.
- Isolated headless Chrome rendered Story Mode with actual pixel assets at
  1658x893 and 390x844: no JavaScript page errors, no horizontal overflow.
- Screenshots: docs/story-scene-fixed-1658.png and story-scene-fixed-390.png.
- Browser validation uses offline RPC stubs; no actual NEAR transaction sent.
- The other districts still use provisional scenes, not finished tile maps.
