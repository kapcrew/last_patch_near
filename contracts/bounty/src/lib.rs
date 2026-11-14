// THE LAST PATCH: independent testnet escrow. NOT AUDITED. No private keys or HTTP calls.
// State is authoritative; GitHub evidence and AI messages are deliberately untrusted.
use near_sdk::{
    env, near, ext_contract, AccountId, BorshStorageKey, Gas, NearToken, PanicOnDefault,
    Promise, PromiseResult, collections::{LookupMap, Vector},
    json_types::U128,
};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::serde_json::json;

const STORAGE_RESERVE: u128 = 80_000_000_000_000_000_000_000; // 0.08 NEAR; non-refundable storage/callback budget
const MAX_REWARD: u128 = 5_000_000_000_000_000_000_000_000; // 5 NEAR testnet per bounty
const OPERATIONS_BUFFER: u128 = 10_000_000_000_000_000_000_000; // 0.01 NEAR beyond priced storage
const CALLBACK_GAS: Gas = Gas::from_tgas(25);
const MAX_BOUNTIES: u64 = 500;

#[derive(BorshDeserialize, BorshSerialize, BorshStorageKey)]
enum StorageKey { Bounties, TaskKeys, Ids, Pending, PaidTotals }

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(crate="near_sdk::serde", rename_all="SCREAMING_SNAKE_CASE")]
pub enum BountyState { Open, Claimed, Submitted, Approved, Withdrawing, Paid, Cancelling, Cancelled }

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Bounty {
    id: u64,
    task_key: Vec<u8>,
    title: String,
    repo: String,
    issue_number: u64,
    building_id: String,
    maintainer: AccountId,
    reward_yocto: u128,
    storage_reserve_yocto: u128,
    worker: Option<AccountId>,
    pr_number: Option<u64>,
    pr_url: Option<String>,
    commit_sha: Option<String>,
    evidence_sha256: Option<String>,
    state: BountyState,
    created_at_ns: u64,
    claimed_at_ns: Option<u64>,
    approved_at_ns: Option<u64>,
    paid_at_ns: Option<u64>,
    tx_nonce: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(crate="near_sdk::serde")]
pub struct BountyView {
    pub id: u64,
    pub task_key: String,
    pub title: String,
    pub repo: String,
    pub issue_number: u64,
    pub building_id: String,
    pub maintainer: AccountId,
    pub reward_yocto: U128,
    pub storage_reserve_yocto: U128,
    pub worker: Option<AccountId>,
    pub pr_number: Option<u64>,
    pub pr_url: Option<String>,
    pub commit_sha: Option<String>,
    pub evidence_sha256: Option<String>,
    pub state: BountyState,
    pub created_at_ns: u64,
    pub claimed_at_ns: Option<u64>,
    pub approved_at_ns: Option<u64>,
    pub paid_at_ns: Option<u64>,
    pub tx_nonce: u64,
}
impl From<Bounty> for BountyView {
    fn from(b: Bounty) -> Self {
        Self {
            id: b.id,
            task_key: encode_hex(&b.task_key),
            title: b.title,
            repo: b.repo,
            issue_number: b.issue_number,
            building_id: b.building_id,
            maintainer: b.maintainer,
            reward_yocto: U128(b.reward_yocto),
            storage_reserve_yocto: U128(b.storage_reserve_yocto),
            worker: b.worker,
            pr_number: b.pr_number,
            pr_url: b.pr_url,
            commit_sha: b.commit_sha,
            evidence_sha256: b.evidence_sha256,
            state: b.state,
            created_at_ns: b.created_at_ns,
            claimed_at_ns: b.claimed_at_ns,
            approved_at_ns: b.approved_at_ns,
            paid_at_ns: b.paid_at_ns,
            tx_nonce: b.tx_nonce,
        }
    }
}

#[derive(Serialize)]
#[serde(crate="near_sdk::serde")]
pub struct BountyPage { pub items: Vec<BountyView>, pub total: u64, pub next_offset: Option<u64> }
#[derive(Serialize)]
#[serde(crate="near_sdk::serde")]
pub struct WorkerBalance { pub account: AccountId, pub withdrawable_yocto: U128, pub withdrawing_yocto: U128, pub paid_total_yocto: U128 }
#[derive(Serialize)]
#[serde(crate="near_sdk::serde")]
pub struct ContractConfig { pub network: &'static str, pub version: &'static str, pub min_reward_yocto: U128, pub max_reward_yocto: U128, pub storage_reserve_yocto: U128, pub refund_policy: &'static str, pub platform_fee_yocto: U128 }
#[derive(Serialize)]
#[serde(crate="near_sdk::serde")]
pub struct ContractStats { pub bounties_count: u64, pub paid_count: u64, pub locked_total_yocto: U128 }

#[ext_contract(ext_self)]
trait SettlementCallback {
    fn on_withdraw_complete(&mut self, id: u64, nonce: u64) -> bool;
    fn on_cancel_complete(&mut self, id: u64, nonce: u64) -> bool;
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    next_bounty_id: u64,
    bounties: LookupMap<u64, Bounty>,
    by_task_key: LookupMap<Vec<u8>, u64>,
    ids: Vector<u64>,
    pending_by_worker: LookupMap<AccountId, u64>,
    paid_total_by_worker: LookupMap<AccountId, u128>,
    paid_count: u64,
    locked_total_yocto: u128,
}

#[near]
impl Contract {
    #[init]
    pub fn new() -> Self {
        Self {
            next_bounty_id: 1,
            bounties: LookupMap::new(StorageKey::Bounties),
            by_task_key: LookupMap::new(StorageKey::TaskKeys),
            ids: Vector::new(StorageKey::Ids),
            pending_by_worker: LookupMap::new(StorageKey::Pending),
            paid_total_by_worker: LookupMap::new(StorageKey::PaidTotals),
            paid_count: 0,
            locked_total_yocto: 0,
        }
    }

    /// Sponsor must attach exactly reward + fixed storage reserve. There is no excess refund Promise.
    #[payable]
    pub fn create_bounty(&mut self, repo: String, issue_number: u64, title: String, building_id: String, reward_yocto: U128) -> u64 {
        let repo = normalized_repo(&repo);
        assert!(issue_number > 0 && issue_number <= u32::MAX as u64, "ERR_INVALID_ISSUE");
        assert!(matches!(building_id.as_str(), "bridge" | "well" | "library" | "forge"), "ERR_INVALID_BUILDING");
        let title = title.trim().to_string();
        assert!((5..=100).contains(&title.chars().count()), "ERR_INVALID_TITLE");
        assert!(self.next_bounty_id <= MAX_BOUNTIES, "ERR_MAX_BOUNTIES");
        let reward = reward_yocto.0;
        assert!(reward > 0 && reward <= MAX_REWARD, "ERR_INVALID_REWARD");
        let attached = env::attached_deposit().as_yoctonear();
        let expected = reward.checked_add(STORAGE_RESERVE).expect("ERR_OVERFLOW");
        assert_eq!(attached, expected, "ERR_INSUFFICIENT_OR_EXCESS_DEPOSIT");
        let key = task_key(&repo, issue_number);
        assert!(self.by_task_key.get(&key).is_none(), "ERR_DUPLICATE_TASK");
        let before_storage = env::storage_usage();
        let id = self.next_bounty_id;
        self.next_bounty_id = id.checked_add(1).expect("ERR_OVERFLOW");
        let b = Bounty {
            id, task_key: key.clone(), title, repo, issue_number, building_id,
            maintainer: env::predecessor_account_id(), reward_yocto: reward,
            storage_reserve_yocto: STORAGE_RESERVE,
            worker: None, pr_number: None, pr_url: None, commit_sha: None, evidence_sha256: None,
            state: BountyState::Open, created_at_ns: env::block_timestamp(),
            claimed_at_ns: None, approved_at_ns: None, paid_at_ns: None, tx_nonce: 0,
        };
        self.bounties.insert(&id, &b);
        self.by_task_key.insert(&key, &id);
        self.ids.push(&id);
        self.locked_total_yocto = self.locked_total_yocto.checked_add(reward).expect("ERR_OVERFLOW");
        let added_bytes = env::storage_usage().saturating_sub(before_storage) as u128;
        let storage_cost = added_bytes.checked_mul(env::storage_byte_cost().as_yoctonear()).expect("ERR_OVERFLOW");
        assert!(storage_cost <= STORAGE_RESERVE.saturating_sub(OPERATIONS_BUFFER), "ERR_STORAGE_RESERVE_TOO_SMALL");
        self.assert_solvency();
        log_event("bounty_created", &b);
        id
    }

    pub fn claim_bounty(&mut self, id: u64) {
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Open, "ERR_WRONG_STATUS");
        let worker = env::predecessor_account_id();
        assert_ne!(worker, b.maintainer, "ERR_SELF_CLAIM");
        b.worker = Some(worker);
        b.state = BountyState::Claimed;
        b.claimed_at_ns = Some(env::block_timestamp());
        self.save_and_assert(&b);
        log_event("bounty_claimed", &b);
    }

    pub fn submit_patch(&mut self, id: u64, pr_url: String, commit_sha: String, evidence_sha256: Option<String>) {
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Claimed, "ERR_WRONG_STATUS");
        assert_eq!(b.worker.as_ref(), Some(&env::predecessor_account_id()), "ERR_NOT_WORKER");
        let pr_number = validate_pr_url(&pr_url, &b.repo);
        assert_eq!(commit_sha.len(), 40, "ERR_INVALID_COMMIT_SHA");
        assert!(commit_sha.bytes().all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase()), "ERR_INVALID_COMMIT_SHA");
        if let Some(ref hash) = evidence_sha256 {
            assert_eq!(hash.len(), 64, "ERR_INVALID_EVIDENCE_HASH");
            assert!(hash.bytes().all(|c| c.is_ascii_hexdigit() && !c.is_ascii_uppercase()), "ERR_INVALID_EVIDENCE_HASH");
        }
        b.pr_number = Some(pr_number);
        b.pr_url = Some(pr_url);
        b.commit_sha = Some(commit_sha);
        b.evidence_sha256 = evidence_sha256;
        b.state = BountyState::Submitted;
        self.save_and_assert(&b);
        log_event("patch_submitted", &b);
    }

    /// GitHub evidence does NOT authorize funds: this call is signed by the original on-chain maintainer.
    pub fn approve_patch(&mut self, id: u64) {
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Submitted, "ERR_WRONG_STATUS");
        assert_eq!(b.maintainer, env::predecessor_account_id(), "ERR_NOT_MAINTAINER");
        assert!(b.pr_url.is_some() && b.commit_sha.is_some(), "ERR_MISSING_EVIDENCE");
        let worker = b.worker.clone().expect("ERR_NO_WORKER");
        assert!(self.pending_by_worker.get(&worker).is_none(), "ERR_WORKER_HAS_PENDING_REWARD");
        self.pending_by_worker.insert(&worker, &id);
        b.state = BountyState::Approved;
        b.approved_at_ns = Some(env::block_timestamp());
        self.save_and_assert(&b);
        log_event("patch_approved", &b);
    }

    /// P0: one pending approved bounty per worker. The transfer must finish before another payout.
    pub fn withdraw_reward(&mut self) -> Promise {
        let worker = env::predecessor_account_id();
        let id = self.pending_by_worker.get(&worker).expect("ERR_NOTHING_TO_WITHDRAW");
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Approved, "ERR_WRONG_STATUS");
        assert_eq!(b.worker.as_ref(), Some(&worker), "ERR_NOT_WORKER");
        self.assert_solvency();
        b.tx_nonce = b.tx_nonce.checked_add(1).expect("ERR_OVERFLOW");
        let nonce = b.tx_nonce;
        b.state = BountyState::Withdrawing;
        self.bounties.insert(&id, &b);
        log_event("withdraw_initiated", &b);
        Promise::new(worker)
            .transfer(NearToken::from_yoctonear(b.reward_yocto))
            .then(ext_self::ext(env::current_account_id()).with_static_gas(CALLBACK_GAS).on_withdraw_complete(id, nonce))
    }

    #[private]
    pub fn on_withdraw_complete(&mut self, id: u64, nonce: u64) -> bool {
        assert_eq!(env::predecessor_account_id(), env::current_account_id(), "ERR_CALLBACK_PRIVATE");
        assert_eq!(env::promise_results_count(), 1, "ERR_BAD_CALLBACK_COUNT");
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Withdrawing, "ERR_WRONG_STATUS");
        assert_eq!(b.tx_nonce, nonce, "ERR_STALE_CALLBACK");
        if matches!(env::promise_result(0), PromiseResult::Successful(_)) {
            b.state = BountyState::Paid;
            b.paid_at_ns = Some(env::block_timestamp());
            self.locked_total_yocto = self.locked_total_yocto.checked_sub(b.reward_yocto).expect("ERR_LEDGER_UNDERFLOW");
            self.paid_count = self.paid_count.checked_add(1).expect("ERR_OVERFLOW");
            let worker = b.worker.clone().expect("ERR_NO_WORKER");
            let paid = self.paid_total_by_worker.get(&worker).unwrap_or(0);
            self.paid_total_by_worker.insert(&worker, &paid.checked_add(b.reward_yocto).expect("ERR_OVERFLOW"));
            self.pending_by_worker.remove(&worker);
            self.bounties.insert(&id, &b);
            log_event("bounty_paid", &b);
            true
        } else {
            b.state = BountyState::Approved;
            self.bounties.insert(&id, &b);
            log_event("withdraw_failed_retryable", &b);
            false
        }
    }

    /// Only unclaimed/open bounties can be cancelled. Reserve stays to secure permanent state storage.
    pub fn cancel_bounty(&mut self, id: u64) -> Promise {
        let mut b = self.must_get(id);
        assert_eq!(b.maintainer, env::predecessor_account_id(), "ERR_NOT_MAINTAINER");
        assert_eq!(b.state, BountyState::Open, "ERR_WRONG_STATUS");
        self.assert_solvency();
        b.tx_nonce = b.tx_nonce.checked_add(1).expect("ERR_OVERFLOW");
        let nonce = b.tx_nonce;
        b.state = BountyState::Cancelling;
        self.bounties.insert(&id, &b);
        log_event("cancel_initiated", &b);
        Promise::new(b.maintainer.clone())
            .transfer(NearToken::from_yoctonear(b.reward_yocto))
            .then(ext_self::ext(env::current_account_id()).with_static_gas(CALLBACK_GAS).on_cancel_complete(id, nonce))
    }

    #[private]
    pub fn on_cancel_complete(&mut self, id: u64, nonce: u64) -> bool {
        assert_eq!(env::predecessor_account_id(), env::current_account_id(), "ERR_CALLBACK_PRIVATE");
        assert_eq!(env::promise_results_count(), 1, "ERR_BAD_CALLBACK_COUNT");
        let mut b = self.must_get(id);
        assert_eq!(b.state, BountyState::Cancelling, "ERR_WRONG_STATUS");
        assert_eq!(b.tx_nonce, nonce, "ERR_STALE_CALLBACK");
        if matches!(env::promise_result(0), PromiseResult::Successful(_)) {
            b.state = BountyState::Cancelled;
            self.locked_total_yocto = self.locked_total_yocto.checked_sub(b.reward_yocto).expect("ERR_LEDGER_UNDERFLOW");
            self.bounties.insert(&id, &b);
            log_event("bounty_cancelled", &b);
            true
        } else {
            b.state = BountyState::Open;
            self.bounties.insert(&id, &b);
            log_event("cancel_failed_retryable", &b);
            false
        }
    }

    pub fn get_bounty(&self, id: u64) -> Option<BountyView> { self.bounties.get(&id).map(Into::into) }
    pub fn list_bounties(&self, offset: Option<u64>, limit: Option<u64>) -> BountyPage {
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(20);
        assert!((1..=25).contains(&limit), "ERR_PAGE_SIZE");
        let total = self.ids.len();
        let end = offset.saturating_add(limit).min(total);
        let mut items = Vec::new();
        for index in offset..end {
            let id = self.ids.get(index).expect("ERR_INDEX");
            items.push(self.must_get(id).into());
        }
        BountyPage { items, total, next_offset: if end < total { Some(end) } else { None } }
    }
    pub fn get_balance(&self, account: AccountId) -> WorkerBalance {
        let (mut approved, mut withdrawing) = (0, 0);
        if let Some(id) = self.pending_by_worker.get(&account) {
            let b = self.must_get(id);
            if b.state == BountyState::Approved { approved = b.reward_yocto; }
            else if b.state == BountyState::Withdrawing { withdrawing = b.reward_yocto; }
        }
        WorkerBalance { account: account.clone(), withdrawable_yocto: U128(approved), withdrawing_yocto: U128(withdrawing), paid_total_yocto: U128(self.paid_total_by_worker.get(&account).unwrap_or(0)) }
    }
    pub fn get_contract_config(&self) -> ContractConfig {
        ContractConfig { network: "testnet", version: "1.0.0-p0", min_reward_yocto: U128(1), max_reward_yocto: U128(MAX_REWARD), storage_reserve_yocto: U128(STORAGE_RESERVE), refund_policy: "Reward only for OPEN cancellations; 0.08 NEAR permanent storage reserve retained", platform_fee_yocto: U128(0) }
    }
    pub fn get_contract_stats(&self) -> ContractStats {
        ContractStats { bounties_count: self.ids.len(), paid_count: self.paid_count, locked_total_yocto: U128(self.locked_total_yocto) }
    }
}

impl Contract {
    fn must_get(&self, id: u64) -> Bounty { self.bounties.get(&id).expect("ERR_NOT_FOUND") }
    fn save_and_assert(&mut self, b: &Bounty) { self.bounties.insert(&b.id, b); self.assert_solvency(); }
    fn assert_solvency(&self) {
        let stake = (env::storage_usage() as u128)
            .checked_mul(env::storage_byte_cost().as_yoctonear()).expect("ERR_OVERFLOW");
        let committed = stake.checked_add(OPERATIONS_BUFFER).and_then(|n| n.checked_add(self.locked_total_yocto)).expect("ERR_OVERFLOW");
        assert!(env::account_balance().as_yoctonear() >= committed, "ERR_ESCROW_UNDERCOLLATERALIZED");
    }
}

fn task_key(repo: &str, issue: u64) -> Vec<u8> {
    let canonical = format!("the-last-patch:v1|testnet|{}|{}|{}", env::current_account_id(), repo, issue);
    env::sha256(canonical.as_bytes())
}
fn normalized_repo(repo: &str) -> String {
    assert!(repo.is_ascii() && (3..=100).contains(&repo.len()), "ERR_INVALID_REPO");
    let normalized = repo.to_ascii_lowercase();
    let pieces: Vec<&str> = normalized.split('/').collect();
    assert_eq!(pieces.len(), 2, "ERR_INVALID_REPO");
    for component in pieces {
        assert!(!component.is_empty() && component.len() <= 100, "ERR_INVALID_REPO");
        assert!(component.bytes().all(|b| b.is_ascii_alphanumeric() || b==b'-' || b==b'_' || b==b'.'), "ERR_INVALID_REPO");
        assert!(component.chars().next().unwrap().is_ascii_alphanumeric(), "ERR_INVALID_REPO");
    }
    normalized
}
fn validate_pr_url(url: &str, repo: &str) -> u64 {
    assert!(url.is_ascii() && url.len() <= 200, "ERR_INVALID_PR_URL");
    let expected = format!("https://github.com/{}/pull/", repo);
    assert!(url.starts_with(&expected), "ERR_PR_WRONG_REPO");
    let number = &url[expected.len()..];
    assert!(!number.is_empty() && number.bytes().all(|b| b.is_ascii_digit()), "ERR_INVALID_PR_URL");
    let parsed: u64 = number.parse().unwrap_or(0);
    assert!(parsed > 0 && parsed <= u32::MAX as u64, "ERR_INVALID_PR_URL");
    assert_eq!(number, parsed.to_string(), "ERR_INVALID_PR_URL");
    parsed
}
fn encode_hex(bytes: &[u8]) -> String {
    const HEX: &[u8;16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len()*2);
    for &b in bytes { out.push(HEX[(b>>4) as usize] as char); out.push(HEX[(b&0x0f) as usize] as char); }
    out
}
fn log_event(event: &str, bounty: &Bounty) {
    env::log_str(&format!("EVENT_JSON:{}", json!({
        "standard": "the_last_patch", "version": "1.0.0", "event": event,
        "data": [{"bounty_id": bounty.id, "state": bounty.state,
            "maintainer": bounty.maintainer, "worker": bounty.worker,
            "reward_yocto": bounty.reward_yocto.to_string(), "tx_nonce": bounty.tx_nonce}]
    })));
}

#[cfg(test)]
mod tests;
