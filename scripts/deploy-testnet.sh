#!/usr/bin/env bash
# Run locally as the owner of the NEAR testnet contract account. NO PRIVATE KEYS in arguments.
set -euo pipefail
if [[ $# -ne 1 ]]; then echo "Usage: scripts/deploy-testnet.sh <contract-account.testnet>";exit 2;fi
ACCOUNT="$1"
if [[ ! "$ACCOUNT" =~ ^[a-z0-9._-]+\.testnet$ ]];then echo "Expected a .testnet contract account";exit 2;fi
command -v cargo >/dev/null || { echo 'Cargo is required: https://rustup.rs';exit 1; }
command -v near >/dev/null || { echo 'Install near-cli-rs';exit 1; }
cd "$(dirname "$0")/../contracts/bounty"
if [[ ! -f Cargo.lock ]];then echo 'Generating Cargo.lock. Inspect and COMMIT this lockfile before any public release.';cargo generate-lockfile;fi
# Native unit tests may pull dev-only dependencies requiring a newer Rust than the
# WASM toolchain. Prefer the installed stable toolchain for native tests, while
# cargo-near uses the project-pinned 1.86.0 toolchain for the WASM artifact.
if command -v rustup >/dev/null && rustup toolchain list | grep -q '^stable'; then
  cargo +stable test --locked
else
  cargo test --locked
fi
# ABI generation is not required for execution. With near-sdk 5.17.2, the
# exposed view types lack JsonSchema, so the ABI pass fails even though the
# contract itself and 10 native tests compile. Use the official no-ABI path.
cargo near build non-reproducible-wasm --no-abi --locked
WASM="$(find target/near target/wasm32-unknown-unknown/release -type f -name 'the_last_patch_bounty.wasm' -print -quit 2>/dev/null || true)"
[[ -n "$WASM" ]] || { echo 'No compiled WASM found after build.';exit 1; }
echo "Deploying $WASM to $ACCOUNT on testnet via your secure keychain."
near contract deploy "$ACCOUNT" use-file "$WASM" with-init-call new json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' network-config testnet sign-with-keychain send
printf '\nDEPLOY COMMAND SENT. Record the REAL transaction hash and check get_contract_config before claiming success.\n'
