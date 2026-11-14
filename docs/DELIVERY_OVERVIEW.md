# Delivery overview

## Artifacts

1. `THE_LAST_PATCH_NEAR_GAME_SOURCE.zip` — this complete standalone project (source code + testnet contract source + compiled web + reproducible fixtures + all docs/test logs). Generated backdrop created for this game, not copied from Pixudi or Starfall.
2. `THE_LAST_PATCH_WEB_DIST.zip` — standalone static hosting bundle, no Node runtime or private key needed. Live disabled until configured after real contract deploy.
3. `THE_LAST_PATCH_RUST_CONTRACT_SOURCE.zip` — near-sdk Rust crate and its deployment docs, **not a compiled WASM**.

## Proven status (14 Nov 2026)

- Clean TypeScript build + `npm test`: PASS (15/15 Node unit tests).
- Offline `npm ci` with vendored, pinned TypeScript 5.8.3: PASS.
- Isolated Chromium sample UI: PASS (4 quests, local sample quest life cycle, keyboard, desktop/mobile hit tests, responsive 320px).
- Isolated Chromium mocked Live RPC projection: PASS (APPROVED not restored, mocked PAID restored, RPC failure read-only).
- Separate intentionally broken GitHub fixture test: 1 expected failure / 1 passing test, useful for actual PR.
- Actual Rust compilation: NOT RUN — Cargo unavailable.
- Actual wallets / testnet deploy / GitHub publication: NOT PERFORMED.
- Real on-chain payout and full P0 proof: NOT VERIFIED.
- P1 and P2: documented roadmap only, not built yet, per strict priority ordering.

## Primary next action

On a networked machine with Rust and NEAR CLI, run `docs/DEPLOY_TESTNET.md` steps. Complete the two-signature issue→PR→approve→withdraw→PAID loop. Do not publish claims of a working escrow before that point.
