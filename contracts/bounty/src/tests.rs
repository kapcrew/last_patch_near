use super::*;
use near_sdk::{testing_env, test_utils::{VMContextBuilder, testing_env_with_promise_results}};
use std::panic::{catch_unwind, AssertUnwindSafe};

fn aid(name: &str) -> AccountId { name.parse().unwrap() }
fn actor(name: &str, deposit: u128) {
    let ctx = VMContextBuilder::new()
        .current_account_id(aid("patches.sponsor.testnet"))
        .signer_account_id(aid(name))
        .predecessor_account_id(aid(name))
        .attached_deposit(NearToken::from_yoctonear(deposit))
        .account_balance(NearToken::from_near(50))
        .build();
    testing_env!(ctx);
}
const REWARD: u128 = 50_000_000_000_000_000_000_000;
fn fixture() -> Contract {
    actor("sponsor.testnet", 0);
    let mut contract = Contract::new();
    actor("sponsor.testnet", REWARD + STORAGE_RESERVE);
    let id = contract.create_bounty("patchkeeper/router".into(), 1, "The Broken Bridge".into(), "bridge".into(), U128(REWARD));
    assert_eq!(id, 1);
    assert_eq!(contract.get_bounty(id).unwrap().state, BountyState::Open);
    contract
}
fn fail(action: impl FnOnce()) { assert!(catch_unwind(AssertUnwindSafe(action)).is_err()); }
fn claimed(mut c: Contract) -> Contract {
    actor("patcher.testnet", 0);
    c.claim_bounty(1);
    c
}
fn submitted(mut c: Contract) -> Contract {
    actor("patcher.testnet", 0);
    c.submit_patch(1, "https://github.com/patchkeeper/router/pull/2".into(), "a".repeat(40), Some("b".repeat(64)));
    c
}
fn approved(mut c: Contract) -> Contract {
    actor("sponsor.testnet", 0);
    c.approve_patch(1);
    c
}
fn callback(result: PromiseResult) {
    let ctx = VMContextBuilder::new().current_account_id(aid("patches.sponsor.testnet"))
        .predecessor_account_id(aid("patches.sponsor.testnet"))
        .signer_account_id(aid("patches.sponsor.testnet"))
        .account_balance(NearToken::from_near(50)).build();
    #[allow(deprecated)]
    testing_env_with_promise_results(ctx, result);
}
#[test]
fn create_deposit_and_views() {
    let c=fixture();
    let view=c.get_bounty(1).unwrap();
    assert_eq!(view.reward_yocto.0, REWARD);
    assert_eq!(view.storage_reserve_yocto.0, STORAGE_RESERVE);
    assert_eq!(c.get_bounty(999).is_none(), true);
    assert_eq!(c.get_contract_stats().locked_total_yocto.0, REWARD);
    assert_eq!(c.list_bounties(Some(0),Some(10)).items.len(), 1);
    assert_eq!(c.list_bounties(Some(1),Some(10)).items.len(), 0);
}
#[test]
fn exact_deposit_required() {
    actor("sponsor.testnet", 0);
    let mut c=Contract::new();
    actor("sponsor.testnet", REWARD);
    fail(||{ c.create_bounty("patchkeeper/router".into(), 1, "Bridge Issue".into(), "bridge".into(), U128(REWARD)); });
}
#[test]
fn duplicate_task_not_allowed() {
    let mut c=fixture();
    actor("sponsor.testnet", REWARD+STORAGE_RESERVE);
    fail(||{c.create_bounty("PATCHKEEPER/ROUTER".into(),1,"A second bounty".into(),"well".into(),U128(REWARD));});
}
#[test]
fn self_claim_rejected() {
    let mut c=fixture();
    actor("sponsor.testnet", 0);
    fail(||c.claim_bounty(1));
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Open);
}
#[test]
fn only_one_claim_and_only_worker_submit() {
    let mut c=claimed(fixture());
    actor("other.testnet", 0);
    fail(||c.claim_bounty(1));
    fail(||c.submit_patch(1,"https://github.com/patchkeeper/router/pull/2".into(),"a".repeat(40),None));
    actor("patcher.testnet", 0);
    fail(||c.submit_patch(1,"https://github.com/evil/router/pull/2".into(),"a".repeat(40),None));
    fail(||c.submit_patch(1,"https://github.com/patchkeeper/router/pull/2?bad=1".into(),"a".repeat(40),None));
    fail(||c.submit_patch(1,"https://github.com/patchkeeper/router/pull/2".into(),"x".repeat(40),None));
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Claimed);
}
#[test]
fn only_maintainer_can_approve() {
    let mut c=submitted(claimed(fixture()));
    actor("patcher.testnet", 0);
    fail(||c.approve_patch(1));
    actor("sponsor.testnet", 0);
    c.approve_patch(1);
    assert_eq!(c.get_balance(aid("patcher.testnet")).withdrawable_yocto.0,REWARD);
    fail(||c.approve_patch(1));
}
#[test]
fn withdrawal_failure_retry_success_no_double_paid() {
    let mut c=approved(submitted(claimed(fixture())));
    actor("other.testnet",0);
    fail(||{ c.withdraw_reward(); });
    actor("patcher.testnet",0);
    let _first=c.withdraw_reward();
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Withdrawing);
    fail(||{ c.withdraw_reward(); });
    // no browser state may complete settlement: only the private callback can do so
    actor("other.testnet",0);
    fail(||{ c.on_withdraw_complete(1,1); });
    callback(PromiseResult::Failed);
    assert_eq!(c.on_withdraw_complete(1,1),false);
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Approved);
    assert_eq!(c.get_balance(aid("patcher.testnet")).withdrawable_yocto.0,REWARD);
    actor("patcher.testnet",0);
    let _second=c.withdraw_reward();
    callback(PromiseResult::Successful(vec![]));
    assert_eq!(c.on_withdraw_complete(1,2),true);
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Paid);
    assert_eq!(c.get_balance(aid("patcher.testnet")).withdrawable_yocto.0,0);
    assert_eq!(c.get_balance(aid("patcher.testnet")).paid_total_yocto.0,REWARD);
    assert_eq!(c.get_contract_stats().paid_count,1);
    assert_eq!(c.get_contract_stats().locked_total_yocto.0,0);
    actor("patcher.testnet",0);
    fail(||{ c.withdraw_reward(); });
}
#[test]
fn cancel_failure_retry_and_success() {
    let mut c=fixture();
    actor("other.testnet",0);
    fail(||{ c.cancel_bounty(1); });
    actor("sponsor.testnet",0);
    let _=c.cancel_bounty(1);
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Cancelling);
    fail(||{ c.cancel_bounty(1); });
    callback(PromiseResult::Failed);
    assert_eq!(c.on_cancel_complete(1,1),false);
    actor("sponsor.testnet",0);
    let _=c.cancel_bounty(1);
    callback(PromiseResult::Successful(vec![]));
    assert_eq!(c.on_cancel_complete(1,2),true);
    assert_eq!(c.get_bounty(1).unwrap().state,BountyState::Cancelled);
    assert_eq!(c.get_contract_stats().locked_total_yocto.0,0);
    actor("patcher.testnet",0);
    fail(||c.claim_bounty(1));
}
#[test]
fn claimed_bounty_cannot_be_cancelled() {
    let mut c=claimed(fixture());
    actor("sponsor.testnet",0);
    fail(||{c.cancel_bounty(1);});
}
#[test]
fn invalid_pagination_rejected() {
    let c=fixture();
    fail(||{c.list_bounties(Some(0),Some(26));});
    fail(||{c.list_bounties(Some(0),Some(0));});
}
