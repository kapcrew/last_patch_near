# NEAR deployment ABI build fix (2026-11-14)

## Applies to
THE LAST PATCH `contracts/bounty` near-sdk 5.17.2 contract after local fixes:
- `borsh = { version = "1", features = ["derive"] }` added to `Cargo.toml`
- `Cargo.lock` pinned to `near-sys 0.2.5` (`cargo update -p near-sys --precise 0.2.5`)
- Rust 1.86.0 override in `contracts/bounty`

## Changes
Only `scripts/deploy-testnet.sh` changed. Uses stable Rust for native tests if installed, then `cargo near build non-reproducible-wasm --no-abi --locked` to avoid existing ABI JsonSchema errors. No `src/lib.rs`, escrow rules, or state layout modified.

## From current working checkout
```
cd 'contracts/bounty'
cargo near build non-reproducible-wasm --no-abi --locked
ls -lh target/near/the_last_patch_bounty.wasm
```

For deploy, FIRST verify `lastpatch.intent.testnet` exists, is owned by your keys, and is not an initialized contract. Then from repository root:
```
./scripts/deploy-testnet.sh lastpatch.intent.testnet
CONTRACT_ID=lastpatch.intent.testnet node scripts/smoke-test.mjs
```

This patch is not evidence of successful build or on-chain deployment. Testnet transactions and key ownership require checks on your machine.
