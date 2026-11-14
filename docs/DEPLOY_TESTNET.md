# THE LAST PATCH — deployment & real on-chain verification

**Status: NOT DEPLOYED / NOT VERIFIED.** Do not infer deployment from an available ZIP, compiled TypeScript or screenshots. Follow these exact steps on a trusted Mac/Linux machine with network access and two independent testnet wallet accounts.

## 0. Prerequisites

- Rust toolchain (`https://rustup.rs/`) and `rustup target add wasm32-unknown-unknown`.
- `cargo install --locked cargo-near` or install cargo-near using the publisher's official release installer. Check `cargo near --help`.
- `cargo install --locked near-cli-rs` or vendor-signed CLI release; check `near --version`.
- Node 20+ (user has Node 24), Git, GitHub CLI `gh` signed in.
- **Two distinct NEAR Testnet accounts:** A = sponsor/maintainer, B = worker. A can also own a separate contract subaccount. Keep key material in OS keychain, never paste seeds/secret keys into chat.
- Public GitHub repo and issue/PR in an authorized repo. This archive includes a reproducible fixture and CI workflow.

Use testnet only. Distinguish between native NEAR and yoctoNEAR: 1 Ⓝ = 10^24 yoctoNEAR. Default P0 sample: reward 0.05 Ⓝ and permanent, non-refundable storage reserve 0.08 Ⓝ. `create_bounty` **must attach exactly 0.13 Ⓝ**. The contract does not create a new token or use mainnet.

## 1. Compile contract and run Rust tests (do not skip)

```bash
cd the-last-patch/contracts/bounty
cargo generate-lockfile               # needed once; commit Cargo.lock for reproducible builds
cargo test --locked                   # MUST PASS before deploying
cargo near build non-reproducible-wasm --locked
find target/near -type f -name 'the_last_patch_bounty.wasm'
```

If Rust compilation fails, do not deploy. Fix the exact compiler output and rerun all tests. The authoring environment did not have Cargo, so **these commands are provided but were not executed successfully here**. A near-workspaces integration run on a real sandbox is recommended before any testnet deposit; none was executed here.

## 2. Create or import a contract account

Make sure A is funded on testnet. Create a dedicated contract subaccount (change both example names to accounts you own):

```bash
# This is a template; replace both identifiers with your real testnet names.
near account create-account fund-myself patches.YOUR_SPONSOR.testnet '2 NEAR' \
  autogenerate-new-keypair save-to-keychain \
  sign-as YOUR_SPONSOR.testnet network-config testnet sign-with-keychain send
```

Alternatively create an account through the wallet and import it to near-cli-rs using the native keychain flow. **The contract account must exist and have available testnet balance before deployment.** Account creation and funding were not performed in this session.

## 3. Deploy with owner signature

From the root `the-last-patch/`, run:

```bash
./scripts/deploy-testnet.sh patches.YOUR_SPONSOR.testnet
```

The script runs tests, builds WASM and invokes `near contract deploy` with `with-init-call new` on **testnet** using your secure CLI keychain. It prints an actual transaction hash only if NEAR accepts the operation. Afterward, run read-only queries:

```bash
CONTRACT_ID=patches.YOUR_SPONSOR.testnet node scripts/smoke-test.mjs

near contract call-function as-read-only patches.YOUR_SPONSOR.testnet \
  get_contract_config json-args '{}' network-config testnet now

near contract call-function as-read-only patches.YOUR_SPONSOR.testnet \
  get_contract_stats json-args '{}' network-config testnet now
```

Do not place fake, illustrative or guessed contract IDs in the submitted README. Record contract ID, deploy hash, WASM SHA-256 digest and explorer link in `docs/PROOF_TRAIL.md` **after** the actual transaction.

## 4. Create public GitHub issue and PR

The supplied `github-fixture/` contains a deliberately broken real test. On its default branch, `npm test` fails the bridge route test (this failure was actually observed locally). Use a new public GitHub repository authorized by the project owners. One possible flow using GitHub CLI:

```bash
cd the-last-patch/github-fixture
git init && git add . && git commit -m 'Initial broken bridge router'
gh repo create your-org/the-last-patch-bridge-lab --public --source . --push

gh issue create --repo your-org/the-last-patch-bridge-lab \
  --title 'Broken dependency: Bridge routing returns impassable' \
  --body 'Fix the delimiter regression in router.mjs. Acceptance: the bridge route becomes passable and npm test passes.'

git switch -c fix/bridge-routing
python3 - <<'PY'
p='router.mjs'
s=open(p).read().replace('`${from}=>${to}`','`${from}->${to}`')
open(p,'w').write(s)
PY
npm test
git add . && git commit -m 'Fix bridge route lookup regression' && git push -u origin fix/bridge-routing

gh pr create --repo your-org/the-last-patch-bridge-lab \
  --title 'Fix broken bridge routing' \
  --body 'Fixes #1. Corrects route lookup delimiter and verifies route is passable.' \
  --base main --head fix/bridge-routing
```

If your `main` default branch or issue number differs, adapt the branch names and **use the actual issue number**. Have a human review and merge the PR only when CI succeeds. The contract never talks to GitHub; the client runs read-only checks and the maintainer signs the decision.

## 5. Configure public Live frontend

From project root after deployment and public issue creation:

```bash
export CONTRACT_ID=patches.YOUR_SPONSOR.testnet
export GITHUB_ISSUE_URL=https://github.com/your-org/the-last-patch-bridge-lab/issues/1
export NEAR_RPC=https://rpc.testnet.fastnear.com
npm ci --offline
npm test
npm run build
npm start
```

`dist/config.json` is public and contains contract account + RPC + issue URL only. Never put private keys or tokens into this file, frontend, repository or VITE_ environment variables. Host `dist` via HTTPS static server; configure `/* → /index.html` SPA fallback on refresh. Browser wallets may redirect back to the page; test that login survives and transactions are fully confirmed via NEAR RPC.

## 6. Reproduce the signed P0 lifecycle

| Step | Wallet A/B | Expected on-chain state |
|---|---|---|
| A: create/fund bounty on bridge issue | A | `OPEN`, reward locked, attached `0.13 Ⓝ` for example |
| B: claim | B, not A | `CLAIMED` |
| B: submit PR URL + verified 40-character head SHA | B | `SUBMITTED` |
| A: review merged PR and CI and approve | A | `APPROVED` |
| B: withdraw | B | `WITHDRAWING` (not paid yet) |
| NEAR contract private callback confirms successful transfer | contract itself | `PAID`, reward removed from liabilities |
| Anonymous browser reload `/live` | no wallet | `PAID`; bridge rendered `restored` |
| B tries to withdraw again | B | must reject `ERR_NOTHING_TO_WITHDRAW` |

All five user-signed change transactions should have their real hashes recorded. Promise callback events and final state must be checked in the explorer, not inferred from wallet success. Test refused wallets, reverted GitHub checks and callback failure in a NEAR sandbox as part of a complete security review.

Read-only manual view after settlement:

```bash
near contract call-function as-read-only "$CONTRACT_ID" get_bounty \
  json-args '{"id":1}' network-config testnet now
```

If more than one bounty was created, use the **actual** ID returned by create or `list_bounties`, not assume ID=1.

## 7. Release gate

```bash
export GITHUB_PR_URL=https://github.com/your-org/the-last-patch-bridge-lab/pull/2
export PAYOUT_TX_URL=https://testnet.nearblocks.io/txns/REPLACE_REAL_HASH
export PUBLIC_GAME_URL=https://your-real-hostname.example/
node scripts/check-release.mjs
```

The release gate intentionally fails unless the lockfile, compiled WASM, contract account, issue, PR, payout link and HTTPS host are provided. These example strings are **not evidence** and cannot be submitted as if live.

## References checked while preparing this guide

- https://docs.near.org/smart-contracts/quickstart
- https://github.com/near/cargo-near
- https://github.com/near/near-cli-rs/blob/main/docs/GUIDE.en.md
- https://docs.fastnear.com/rpc
- https://github.com/near/wallet-selector/blob/main/MIGRATION-v10.md
