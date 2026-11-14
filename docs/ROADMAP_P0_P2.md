# P0 → P1 → P2 — strict implementation gates

**Do not begin P1/P2 as a substitute for unverified P0.** A visual storefront alone is not a hackathon MVP with a real economy.

## P0 — Hackathon contest slice

### Authored locally (not equal to deployed)

- New generated city illustration; four mapped building sites with procedural broken/progress/restored pixel art.
- Sample city and complete simulated four-quest story loop, clearly labeled and isolated.
- Rust contract source with exact-deposit escrow, one pending reward/worker, sponsor-authorized human review, async Promise payouts/refund callbacks, no repeat withdrawals, view methods and event logs.
- Wallet-selector adapter for real NEAR Testnet signing (unverified browser wallet flow).
- Read-only public GitHub issue and PR evidence validation; public fixture with failing bridge regression test.
- UI projection from RPC only, automatic bridge restoration after chain state PAID.
- 15 Node unit tests and isolated Chromium sample/live mocked RPC tests; static `dist/` and launch instructions.

### Must pass for real P0 completion

1. Compile Rust `cargo test --locked` and WASM; measure maximum storage usage; fix failed Rust tests.
2. NEAR workspaces sandbox payout callback success/failure, replay protection and gas tests.
3. Deploy to real testnet contract account, confirm `get_contract_config` and code hash.
4. Publish authorized GitHub fixture, create issue and merged CI-green PR.
5. Complete real A(sponsor) and B(worker) signed flow and verify final `PAID` independently via explorer/RPC.
6. Test MyNearWallet integration after HTTPS deployment and account switching.
7. Save all hashes, publish public source + X demo, and submit hackathon form. Update `docs/PROOF_TRAIL.md` and 91-test status matrix.

## P1 — after verified P0

- Live bounties for Well, Library and Forge, GitHub App and webhook/indexer status checks, owner/repo maintainer mapping, better evidence freshness.
- Real AI coding guide behind server-side provider (secret keys never in client) with source quotes and fallback. NPC conversational memory is narrative only.
- District map 640×360 camera viewport, 2–3 districts and NPC dialogue branching, environmental reactions, sfx opt-in, collectible reputation and achievements.
- Better asset packs and sprite atlases from licensed Pixudi/Starfall or newly illustrated sprites. `AssetRegistry` already abstracts file names.
- Browser Playwright E2E on HTTPS, mobile screen readers and full 91-case test suite.

## P2 — only after business, legal and security review

- Multiple cities, seasonal open-source task boards, collaboration, guilds, reputation, dynamic events.
- Rich NPC agents, curated repositories and scalable independent proof/indexing service.
- Mainnet deployment only after independent contract audit, adversarial QA, funding model and legal assessment; do not equate testnet rewards with money.
- No custom token required. Native NEAR with real verified useful code work remains the product's core.
