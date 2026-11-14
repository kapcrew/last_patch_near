# Test status — 91 acceptance checks

Source of test names: `THE_LAST_PATCH_MASTER_TZ_RU.md` Section 35. Results below distinguish mock/unit coverage from real RPC/NEAR execution. Date: 14 November 2026. `PASS — UNIT` is **not** equivalent to testnet E2E success.

| ID | Test scenario | Status | Evidence / blocker |
|---|---|---|---|
| TC-001 | Создание с корректным депозитом | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-002 | Нулевое вознаграждение | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-003 | Меньше required deposit | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-004 | Слишком большой reward | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-005 | Дублированная issue | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-006 | Неверный repo slug | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-007 | Длинный заголовок | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-008 | Неверный building id | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-009 | Принятие open bounty | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-010 | Self-claim maintainer | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-011 | Двойной claim | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-012 | Claim после cancellation | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-013 | Submit правильного PR | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-014 | Submit чужим кошельком | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-015 | Submit без claim | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-016 | Submit с неправильным SHA | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-017 | Submit чужого repo | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-018 | Approve from maintainer | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-019 | Approve from worker | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-020 | Approve before submit | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-021 | Double approval | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-022 | Withdraw by worker | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-023 | Withdraw wrong account | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-024 | Withdraw twice while inflight | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-025 | Successful payout callback | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-026 | Failed payout callback | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-027 | External callback attack | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-028 | Double paid withdrawal | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-029 | Cancel OPEN by maintainer | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-030 | Cancel after claimed | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-031 | Cancel by outsider | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-032 | Refund callback failure | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-033 | Refund callback success | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-034 | Balance accounting across two bounties | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-035 | Pagination bounded | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-036 | Unknown bounty lookup | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-037 | Storage bounds | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-038 | Public issue found | PASS — MOCKED UNIT | `tests/github.test.mjs` |
| TC-039 | Public PR found | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-040 | PR belongs different repo | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-041 | PR is open | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-042 | Merged PR | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-043 | No GitHub checks | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-044 | CI failed | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-045 | CI skipped | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-046 | GitHub 429 | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-047 | GitHub 404 | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-048 | GitHub network timeout | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-049 | URL lookalike host | PASS — UNIT | `tests/logic.test.mjs` |
| TC-050 | URL unicode trick | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-051 | PR SHA mismatch | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-052 | Malicious issue markdown | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-053 | Anonymous sample | PASS — ISOLATED SAMPLE BROWSER | `docs/logs/ui-smoke.log` |
| TC-054 | Anonymous live | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-055 | Wrong network | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-056 | Wallet rejected signature | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-057 | Wallet account switch | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-058 | Wallet disconnect mid-submit | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-059 | RPC unreachable | PASS — MOCK RPC DOM | `docs/logs/ui-live-mocked.log` |
| TC-060 | RPC returns stale OPEN | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-061 | Tx signing accepted but receipt fails | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-062 | Tx timed out | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-063 | Paid status read | PASS — MOCK RPC DOM | `docs/logs/ui-live-mocked.log` |
| TC-064 | Approved not paid | PASS — MOCK RPC DOM | `docs/logs/ui-live-mocked.log` |
| TC-065 | Sample does not modify live | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-066 | No live quests | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-067 | Untrusted tx hash query | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-068 | Independent explorer link | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-069 | World hit test desktop | PASS — ISOLATED BROWSER | `docs/logs/ui-smoke.log` |
| TC-070 | World hit test mobile | PASS — ISOLATED BROWSER | `docs/logs/ui-smoke.log` |
| TC-071 | Character path avoids river | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-072 | Frame delta variability | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-073 | Missing image fallback | PASS — ISOLATED BROWSER | `docs/logs/ui-smoke.log` |
| TC-074 | Broken/Restored sprite swap | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-075 | Keyboard quest navigation | PASS — ISOLATED BROWSER | `docs/logs/ui-smoke.log` |
| TC-076 | Modal focus | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-077 | Reduced motion | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-078 | Mobile 320 CSS px | PASS — ISOLATED BROWSER | `docs/logs/ui-smoke.log` |
| TC-079 | No color-only status | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-080 | Audio opt-in | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-081 | AI key missing | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-082 | AI invalid JSON | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-083 | Prompt injection attempt | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-084 | AI fake security claim | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-085 | No credentials in bundle | PASS — STATIC SCAN | `docs/logs/dist-secret-pattern-scan.log` |
| TC-086 | Clean npm install | PASS — LOCAL OFFLINE | `docs/logs/npm-ci-and-tests.log` |
| TC-087 | Clean Rust build | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-088 | Public deep link | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-089 | README truthful scope | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-090 | Submission link checks | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |
| TC-091 | Other project cross-reference | NOT RUN | requires Rust sandbox, browser, public GitHub or real NEAR testnet |

## Local checks outside the 91-case matrix

- Node tests: **15/15 PASS**: `docs/logs/npm-ci-and-tests.log`. Includes read-only RPC mocked responses, GitHub Actions checks, URL spoofing, exact yocto math, and sample/live state isolation.
- GitHub fixture: expected failure before PR; see `github-fixture/router.test.mjs`.
- Cargo invocation: **NOT RUN — cargo command missing**; captured in `docs/logs/cargo-test.log`.
- Release gate: expected failure while missing on-chain proof; captured in `docs/logs/release-gate.log`.

Do not mark Rust, on-chain or browser checks green until actually executed and documented.
