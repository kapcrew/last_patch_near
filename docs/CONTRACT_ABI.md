# Contract interface (intended; NOT compiled)

Target `near-sdk = 5.17.2`, `network = testnet`. JSON amounts are decimal **strings** for U128, never floats. Change method names form an explicit API contract.

| Method | Args | Role / deposit | State |
|---|---|---|---|
| `new` | `{}` | Deploy account / no deposit | initialize |
| `create_bounty` | `{repo,issue_number,title,building_id,reward_yocto}` | sponsor; exact `reward + 0.08 NEAR` | none→OPEN |
| `claim_bounty` | `{id}` | worker != sponsor, 0 NEAR | OPEN→CLAIMED |
| `submit_patch` | `{id,pr_url,commit_sha,evidence_sha256?}` | assigned worker, 0 NEAR | CLAIMED→SUBMITTED |
| `approve_patch` | `{id}` | sponsor/maintainer, 0 NEAR | SUBMITTED→APPROVED |
| `withdraw_reward` | `{}` | assigned worker, 0 NEAR | APPROVED→WITHDRAWING→callback→PAID/APPROVED |
| `cancel_bounty` | `{id}` | maintainer, OPEN only | OPEN→CANCELLING→callback→CANCELLED/OPEN |
| `on_withdraw_complete` | `{id,nonce}` | private contract callback | complete/fail |
| `on_cancel_complete` | `{id,nonce}` | private contract callback | complete/fail |
| `get_bounty` | `{id}` | view | BountyView (incl. canonical `pr_number`) or null |
| `list_bounties` | `{offset?:u64,limit?:u64}` | view | page <=25 |
| `get_balance` | `{account:AccountId}` | view | withdrawable/withdrawing/paid_total strings |
| `get_contract_config` | `{}` | view | network/version/limits/storage policy |
| `get_contract_stats` | `{}` | view | count/paid/locked_total strings |

State names: `OPEN`, `CLAIMED`, `SUBMITTED`, `APPROVED`, `WITHDRAWING`, `PAID`, `CANCELLING`, `CANCELLED`. All four buildings are accepted by the contract; only Bridge is enabled as live in P0 UI. `get_balance` supports a single pending approved credit per worker in P0; additional approved bounty for that worker must be rejected until payout is settled.
