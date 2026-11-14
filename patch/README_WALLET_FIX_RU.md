# THE LAST PATCH — wallet/RPC fix

**Назначение:** точечный патч существующего проекта (НЕ заменяет весь проект и НЕ трогает Rust-контракт).

Изменения:
- `src/chain/wallet.ts`: MyNearWallet заменён на Meteor Wallet (Wallet Selector v10.1.4); показ ошибок загрузки CDN.
- `index.html`: подключён официальный CSS для модального окна Wallet Selector (v10.1.4).
- `scripts/build.mjs`: сборка отклоняет некорректный `NEAR_RPC` (включая Markdown-ссылку).

## Применение на Mac

Остановите запущенный сервер через Ctrl+C, затем из корня локального проекта `the-last-patch 2`:

```bash
unzip -o ~/Downloads/THE_LAST_PATCH_NEAR_WALLET_FIX.zip -d .
export CONTRACT_ID="lastpatch.intent.testnet"
export NEAR_RPC="https://rpc.testnet.fastnear.com"
npm test
npm start
```

Перейдите на http://localhost:8080/live, нажмите CONNECT WALLET, выберите Meteor Wallet. Для десктопного браузера установите официальное расширение Meteor Wallet и настройте в нём NEAR **Testnet**. Аккаунт, сохранённый в Keychain NEAR CLI, НЕ появляется автоматически в браузерном кошельке. Не копируйте seed/key в чаты или посторонние сайты. Установите расширение только из официального источника.

## Проверка

Проверьте http://localhost:8080/config.json — поле `rpc` должно быть просто `https://rpc.testnet.fastnear.com`.

Если окно кошелька всё ещё не открывается, откройте DevTools (Cmd+Option+J), вкладку Console; проверьте ошибку подключения к esm.sh или CDN, и Network (F12). Браузерный модуль Wallet Selector загружается из Интернета, поэтому блокировка CDN или отсутствие доступа нарушит подключение. 

**Статус:** локальные TypeScript и 15 Node-тестов прошли. Ручной интерактивный вход в Meteor и подпись Testnet-транзакции не были проведены; требуется проверка в реальном браузере пользователя.
