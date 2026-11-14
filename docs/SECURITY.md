# Security model — must be reviewed before transfer

**Testnet-only, unaudited. Do not put mainnet funds at risk.** The P0 contract is a work-in-progress implementation of human-approved native NEAR reward escrow.

## Threat boundaries

- `create_bounty` funding is a payable on-chain method, requires exact deposit and bounded data. The input repo is normalized, each issue has deterministic task key, and task key duplicates are blocked. An excess or underfunded deposit reverts rather than silently mixing funds.
- `claim_bounty` checks different predecessor than funding maintainer and OPEN state. `submit_patch` checks on-chain claimed worker and canonical GitHub PR path. GitHub API and any AI assistant **cannot attest on-chain correctness**.
- `approve_patch` checks sponsor/maintainer predecessor, submitted evidence and worker with no existing approved credit. The browser button is not an authorization boundary.
- `withdraw_reward` is worker-only through `pending_by_worker`; it transitions to `WITHDRAWING` before scheduling Promise, blocking duplicate attempts. Contract self-only callback checks nonce and Promise success before setting `PAID`. Failure restores `APPROVED` without decrementing locked liabilities.
- `cancel_bounty` only OPEN + maintainer; private callback on refund success sets CANCELLED and subtracts reward liability, failure restores OPEN.
- Ledger `locked_total_yocto` tracks unpaid reward commitments. Solvency guard ensures `account_balance >= total reward liabilities + network storage requirement + operation buffer` on initial funding and writes. Fixed reserve is conservatively budgeted but **not verified by near-workspaces storage tests**.
- Max reward 5 testnet NEAR, max 500 bounties, page size <= 25, 40 lowercase SHA-1 hex and optional 64 lowercase evidence SHA-256. Restricts memory/storage abuse.

## Attack tests authored (Rust; not run locally)

- Missing exact reward+reserve deposit.
- Duplicate task key with uppercase repo.
- Maintainer self-claim.
- Double claim.
- Other account submits PR or PR points to other repo.
- Other account approves.
- Other account withdraws.
- Repeated withdrawal during `WITHDRAWING`.
- Unauthorized callback call.
- Failed transfer returns reward to `APPROVED` and permits retry.
- Successful callback makes reward `PAID` and then permanently blocks duplicate withdrawal.
- Wrong cancel permissions, cancel retry, cancel blocked after claim.
- Pagination limits.

## Unresolved before hackathon 'live economy' claim

1. Run `cargo test --locked` and near-workspaces sandbox tests, capturing exact pass log and storage usage.
2. Confirm callback return, reentrancy/receipt behavior and account-balance solvency under real NEAR testnet gas semantics.
3. Verify both wallets' transaction flow, multisession reload, password/redirect rejection and a private callback negative test in sandbox.
4. Audit third-party `esm.sh` dependencies / deliver vendored version-locked wallet selector to reduce CDN integrity risk.
5. Manually verify actual GitHub issue/merged PR/commit sha/check-runs evidence; GitHub cannot be invoked by the contract.
6. Confirm DNS+HTTPS hosting, Content Security Policy and external links before public submission.

## User-facing privacy

Public testnet account names, GitHub repo/PR/commit SHA and transaction hashes are public; do not include usernames or personal data in hidden telemetry. No tracking, backend database or AI API keys in this release. Never request user seed phrases in GitHub issues or chat.
