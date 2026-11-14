# IMPLEMENTATION STATUS — gameplay expansion patch (local authoring run)

This file reflects the real state of the patch delivered in this run. It is intentionally conservative.

| Module | Status | Evidence / run command / note |
|---|---|---|
| SITE-01 — Pixel Landing | DONE | `index.html` refreshed; home route updated for Story / Live split |
| SITE-02 — Static Routes | DONE | `/`, `/sample`, `/live`, `/about` handled in `src/main.ts`; `npm run build` |
| SITE-03 — World Explorer | PARTIAL | New 4-district story explorer with hotspot movement in `src/game/StoryRenderer.ts`; hotspot walking, not full free-roam tile navigation |
| SITE-04 — Public Leaderboard | PARTIAL | Local browser leaderboard implemented via `localStorage`; not a public remote service |
| ART-01 — Asset Manifest V2 | DONE | `public/assets/manifest.json` v2 with flat entries + story/live art mappings |
| ART-02 — Pixel Icon Set | DONE | Added cropped icon set under `public/assets/ui/` |
| ART-03 — Player Animations | PARTIAL | Player sheet integrated and rendered with simple frame cycling |
| ART-04 — NPC Sprites | PARTIAL | NPC sheets integrated and used in story districts; limited unique roster, some re-use |
| ART-05 — Buildings | DONE | New building art integrated for bridge/well/library/forge states |
| ART-06 — Tilemaps | PARTIAL | District scenes are custom-rendered with assets + hotspots; not authored as full external tilemap files |
| GAME-01 — Input Manager | DONE | Mouse/touch click, keyboard focus cycling and Enter interaction in Story mode |
| GAME-02 — A* Pathfinding | NOT DONE | Story mode currently uses directed hotspot walking, not A* |
| GAME-03 — Camera | PARTIAL | Fixed-frame camera per district, no scrolling camera |
| GAME-04 — Scene Manager | DONE | Route-based scene split: home / story / live / about |
| GAME-05 — Player Controller | PARTIAL | Click-to-move / focus-to-interact; no full 8-direction free movement |
| GAME-06 — NPC System | DONE | NPC hotspots, dialogue modal, district-specific interaction mapping |
| GAME-07 — Quest Engine | DONE | Main + side quest progression from CSV-derived content, prerequisites, unlocking, rewards |
| GAME-08 — Puzzle Weaver | DONE | Sequence puzzle family implemented |
| GAME-09 — Puzzle Nullflow | DONE | Toggle/fallback puzzle family implemented |
| GAME-10 — Puzzle Diff | DONE | Choice/diff puzzle family implemented |
| GAME-11 — Puzzle Clock | DONE | Ordered-event puzzle family implemented |
| GAME-12 — Puzzle Signature | DONE | Role/approval puzzle family implemented |
| GAME-13 — Puzzle Relay | DONE | Relay sequence puzzle family implemented |
| GAME-14 — World State | DONE | District unlocks, restored flags, visual progress, ending flag |
| GAME-15 — Inventory | DONE | Persistent local inventory and quest item rewards |
| GAME-16 — Dialogue | DONE | Modal dialogue flow plus helper text |
| GAME-17 — Save System | DONE | 3 local save slots, autosave, manual save, clear slot via `localStorage` |
| GAME-18 — Story Journal | PARTIAL | Questbook + overview implemented; no separate longform codex UI |
| GAME-19 — Achievements | DONE | Local achievement tracking and rendering |
| GAME-20 — Finale | PARTIAL | Final choice and campaign-complete flag implemented; no bespoke cinematic sequence |
| COMM-01 — Challenges | PARTIAL | Quest/puzzle loop present; timed challenge/community wrappers not implemented |
| COMM-02 — Leaderboard API | NOT DONE | No remote backend API |
| LIVE-01 — Wallet | DONE | Existing wallet connection flow preserved |
| LIVE-02 — NEAR Read Adapter | DONE | Existing RPC view adapter preserved; tests still green |
| LIVE-03 — Escrow Contract | PARTIAL | Existing front-end flow preserved; no new contract work executed in this run |
| LIVE-04 — GitHub Evidence | DONE | Existing evidence validation flow preserved; tests still green |
| LIVE-05 — Live Visual Projection | DONE | Live page still reflects contract status for Bridge route only |
| AI-01 — Helper | DONE | Existing AI helper kept; story quest detail can invoke helper |
| OPS-01 — Build & Deploy | DONE | `npm run build` emits static `dist/`; routes served by `scripts/serve.mjs` |
| OPS-02 — Security & Privacy | PARTIAL | No secrets added; local-only save/leaderboard; no security review beyond prior baseline |
| OPS-03 — QA Automation | PARTIAL | Existing unit tests pass; new Story mode lacks dedicated browser automation coverage |

## Commands run in this authoring cycle

- `npm run build` — PASS
- `npm test` — PASS (15/15)
- `node scripts/serve.mjs` + `curl -I http://127.0.0.1:8080/sample` — PASS (200 OK)

## Honest gaps remaining

1. Story mode is now substantially larger and playable, but it is still a **vertical gameplay expansion**, not a final polished production campaign.
2. District traversal is hotspot-based rather than true A* tile navigation.
3. Leaderboard is **local browser storage only**, not a remote public leaderboard.
4. Save system uses `localStorage`, not IndexedDB.
5. Live NEAR / GitHub codepath is preserved, but no new on-chain deployment or signing proof was produced in this run.
