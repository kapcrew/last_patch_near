THE LAST PATCH — MULTI-BOUNTY PATCH
-----------------------------------
ВНИМАНИЕ: этот патч применять поверх твоего существующего проекта с установленным Meteor Wallet patch.

1. Остановить npm start (Ctrl+C).
2. Перейти в папку проекта:
   cd "/Users/alexdarkwing/Downloads/the-last-patch 2"
3. Распаковать прямо сюда:
   unzip -o ~/Downloads/THE_LAST_PATCH_MULTI_BOUNTY_PATCH.zip -d .
4. Настроить корректную конфигурацию и пересобрать:
   export CONTRACT_ID="lastpatch.intent.testnet"
   export NEAR_RPC="https://rpc.testnet.fastnear.com"
   npm test
   npm start
5. Открыть http://localhost:8080/live и нажать + CREATE NEW BOUNTY.

ДЛЯ КАЖДОГО нового bounty нужен отдельный публичный GitHub Issue (новый номер).
На текущем on-chain контракте максимально 500 bounty. Каждое новое задание требует новый подписанный депозит.
НЕ ПЕРЕДЕПЛОИВАТЬ Rust-контракт и НЕ ВЫЗЫВАТЬ new() повторно.

Подробнее: docs/LIVE_MULTI_BOUNTY_RU.md
