# THE LAST PATCH — A City Held Together by Open Source

**Fix real bugs. Restore a dying pixel world. Earn on NEAR.**

NEAR Hackathon 2026 / Games With Real Economies / Open Innovation (subject to eligibility).

> **VERIFICATION STATUS (14 Nov 2026):** Local TypeScript static build and **15 Node unit tests PASS**, including clean offline `npm ci`. Isolated Chromium sample/keyboard/mobile smoke also **PASS**; this is not an end-to-end network test. Rust source written and Rust tests authored but **NOT COMPILED** in this environment (Cargo unavailable). No contract deployed, no on-chain transaction hashes, no GitHub Issue/PR created, no public HTTPS deployment. **DO NOT DESCRIBE THIS AS A COMPLETED LIVE ECONOMY UNTIL VERIFIED.**

## Gameplay

Four broken places: The Broken Bridge (Bridgekeeper), The Silent Well (Water Witch), The Dark Library (Paper Golem) and The Sleeping Forge (Iron Fox). The game opens to a pixel city backdrop; choose `/sample` for a full offline story loop with zero funds or `/live` for read-only chain data and real signed operations after deployment. Only **Bridge** is wired as a live quest in P0; the other three are explicitly sample.

The real transition path is `create_bounty → claim_bounty → submit_patch → approve_patch → withdraw_reward → [async callback] PAID`. Only `PAID`, reread from RPC, changes the live bridge sprite to restored. GitHub evidence is informational; only on-chain maintainer account approval authorizes funds. Native testnet NEAR only, no token, NFT, staking, lending or mainnet value.

## Start now (no wallet needed)

```bash
node --version   # 20+
npm ci           # installs bundled, locked TypeScript compiler; works offline
npm test         # rebuild and run Node tests
npm run build    # creates independent dist/ static site
npm start        # serves dist/ on http://localhost:8080
npm run test:ui # optional: needs Python Playwright and Chromium; isolated sample smoke
python scripts/ui-live-rpc-mocked.py # optional mocked Live projector test; not real NEAR
# or PORT=8765 npm start
```

The code has no runtime npm dependencies. TypeScript 5.8.3 is archived under `vendor/` (Apache-2.0) and pinned in `package-lock.json`, so `npm ci --offline` and `npm test` now work reproducibly without registry access. Copy the `dist/` directory to any static HTTPS host; fallback routes must return `index.html`.

## Before enabling Live

1. Install Rust/Cargo and near-cli-rs; read [`docs/DEPLOY_TESTNET.md`](docs/DEPLOY_TESTNET.md).
2. `cd contracts/bounty && cargo generate-lockfile && cargo test --locked && cargo near build non-reproducible-wasm --locked`.
3. Create/own a funded `something.youraccount.testnet` account. Deploy with `scripts/deploy-testnet.sh something.youraccount.testnet` from the repository root. The account owner must authorize the transaction locally. **Do not upload keys.**
4. Set `CONTRACT_ID=...testnet` and optional `GITHUB_ISSUE_URL=...` in your shell, then `npm run build`. A `dist/config.json` file is generated and can also be edited after build. It must contain only public non-secret information.
5. Open `/live`; have sponsor A fund bridge with 0.05 Ⓝ reward + 0.08 Ⓝ non-refundable permanent storage reserve. Worker B claims, submits actual public PR evidence, A approves after PR merge/CI/human review, B withdraws. Wait for callback and reread contract `PAID`. Verify transaction outcomes in an explorer.
6. Run `CONTRACT_ID=...testnet node scripts/smoke-test.mjs` and configure the release gate `node scripts/check-release.mjs` after real proof exists.

## How money is protected

Escrow amount is tracked in exact integer yoctoNEAR strings. `create_bounty` requires **exact deposit = reward + 0.08 Ⓝ reserve**. The storage reserve is retained permanently as collateral/operational funds and **not a refundable reward**. Zero platform fee. Contract verifies the wallet predecessor, checks task and PR formats, disallows same maintainer as worker, rejects duplicated claims and withdrawal attempts, and uses `WITHDRAWING → PAID` only after successful asynchronous transfer callback. Failed transfer returns to `APPROVED` for safe retry. `OPEN` cancellation refunds the reward only via its own callback and retains the reserve. An active claimed bounty has no automatic expiration in beta.

**This is hackathon testnet code, NOT a production-audited escrow.** Rust security tests must pass before deployment; contract code is not certified by the local Node tests.

## Source and deployment references

- `contracts/bounty/src/lib.rs`: Rust contract, contract state, async callbacks and pagination.
- `contracts/bounty/src/tests.rs`: Rust role/escrow/callback tests (authored, unexecuted locally).
- `src/main.ts`: signed player/maintainer UX; RPC read before any visual transition.
- `src/game/*`: rendering / asset registry, independent of finance state.
- `src/domain/logic.ts`: four original named quests, separated sample transitions and live selectors.
- `src/github/evidence.ts`: public GitHub PR checks, SHA and CI / checks status.
- `src/chain/wallet.ts`: pinned Wallet Selector v10 adapter loaded from esm.sh; **browser integration not verified in this offline environment**. For release, bundle/version-audit vendor libraries instead of relying on a third-party CDN.
- `github-fixture/*`: intentionally broken bridge router with one failing unit test; create a *real* GitHub issue and PR; details in `github-fixture/README.md`.
- `docs/IMPLEMENTATION_STATUS.md`: exact verification matrix plus `docs/TEST_STATUS.md` (91 scenarios), `docs/ROADMAP_P0_P2.md` and isolated browser screenshots; `docs/PROOF_TRAIL.md`: all as-yet-unverified on-chain proof slots.

## Unavailable original source

The governing technical spec describes a prior archive named `THE_LAST_PATCH_NEAR_Standalone_Starter.zip`, but **that ZIP was not among the four files uploaded in this run and was not retrievable**. Consequently this archive is a reconstruction from the spec (including original building names/sample transitions), not a minimal-diff patch or proven preservation of the original files or their five tests. The Pixudi and Starfall ZIP files were inspected for asset inventory but not wholesale copied: no per-file art permissions could be verified. A newly generated original backdrop is included, with optional sprite slots.

## Security/privacy

Never commit NEAR keys, GitHub OAuth tokens, AI provider secrets or wallet recovery phrases. `dist/config.json` contains **public** contract ID/RPC/issue URL only. The helper is deterministic and non-authoritative; it never moves funds or merges PRs. Only testnet assets are supported and have no monetary value. See [`docs/SECURITY.md`](docs/SECURITY.md).

## License

Code in this new standalone archive: MIT (see `LICENSE`). Generated artwork included for this product; no Pixudi/Starfall source image was redistributed.
