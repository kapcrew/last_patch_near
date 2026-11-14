# Architecture — trust boundaries & game design

## Runtime boundaries

- `/sample`: only `INITIAL_SAMPLE` and pure `sampleNext()` state. It never calls `NearWallet.change`; transitions are demonstrative and clearly labeled no funds.
- `/live`: `getBounties()` performs NEAR `query/call_function` via configured Testnet RPC. This read returns the only authoritative `Bounty.state`. Player actions are wallet-signed; UI waits for a fresh RPC read after the wallet returns. A wallet redirect or UI optimistic animation never implies `PAID`.
- Rendering: `WorldRenderer` consumes `visualState()` only. `PAID -> restored`; `CLAIMED`, `SUBMITTED`, `APPROVED`, `WITHDRAWING` -> progress; all other states -> broken. This policy is tested in Node.
- World: logical 640×360 viewport (double the 320×180 source spec), 4 clickable sites, click-to-move with safe horizontal waypoint lane, project-independent original background and procedural buildings, keyboard-accessible questbook.
- Contract: near-sdk Rust 5.17.2, single escrow ledger, indexed fixed pagination, one pending worker reward in P0, storage reserve pricing and solvency checks. No independent owner drain. All payout/cancel transfers asynchronous with private callbacks.
- GitHub: plain public REST API issue/PR verification and check-runs lookup. Does not mutate GitHub or approve funds. Evidence SHA-256 is an audit fingerprint, not proof of code correctness.
- AI: offline deterministic explanation only in P0; no AI secret or signing tool. A P1 server-side provider may be added after P0 verified.

## Live data sources

1. NEAR Testnet contract read RPC: `get_bounty`, `list_bounties`, `get_contract_config`, `get_contract_stats`, `get_balance`. Does not cache a financial truth in localStorage.
2. NEAR Wallet Selector v10 (loaded via pinned CDN at runtime): user-triggered change transactions. Requires external browser integration test before judged submission.
3. Public GitHub `issues`, `pulls`, `status` and `check-runs` APIs: informational external checks. HTTP 403/404 or no correct SHA = unverified.
4. Local procedural fallback and `public/assets/manifest.json`: visual only.

## Critical known simplifications

- One live Bridge quest instead of four on-chain buildings (P0 spec allows).
- No GitHub App/OAuth, no automated maintainer-to-repo cryptographic binding; on-chain sponsor itself approves manually.
- No event indexer or durable cross-device transaction history; proof trail currently shows contract status and wallet-returned or URL-redirect hashes only. Complete explorer history must be recorded manually in docs/PROOF_TRAIL.md.
- No backend AI server or WebGPU engine; these are P1/P2, not blocking P0 security.
- Static native TS compilation rather than Vite bundling, due offline registry in the authoring environment. This choice is recorded in DECISIONS.
- Wallet-selector CDN is a temporary integration path; static build works offline, but wallet integration requires network and browser verification.
