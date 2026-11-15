# THE LAST PATCH — несколько bounty в Live Mode

Версия фронтенда: Live Multi-Bounty Board 2026-11-15.

## Что изменилось

- Список **всех** on-chain bounty на странице `/live`, а не только одного bridge bounty.
- `+ CREATE NEW BOUNTY` доступна независимо от статуса выбранного задания: OPEN, CLAIMED, SUBMITTED, APPROVED, PAID или CANCELLED.
- Каждое bounty имеет свой ID, GitHub Issue, название, сумму, район, maintainer, worker, статус и PR.
- Можно открыть старое bounty и выполнить именно для него claim / cancel / submit / approve / withdraw. Кнопки изменения статуса основаны на актуальном RPC-состоянии.
- Новый контракт/повторный деплой для этих изменений **не требуется**.
- Динамическая пагинация RPC забирает все страницы `list_bounties`, а не только первые 500 на фронтенде.
- Добавлены два теста пагинации (всего 17 JavaScript-тестов), и отдельный Playwright тест взаимодействия (только MOCK RPC/кошелёк, не on-chain).

## Честные ограничения РЕАЛЬНОГО развернутого контракта

- Контракт `lastpatch.intent.testnet` ограничен **500 bounty** (`MAX_BOUNTIES=500`). Изменение этого предела потребует отдельного обновления кода контракта и его безопасного on-chain upgrade. Эта версия изменяет только UI и RPC-пагинацию; 500 не снимается.
- Каждый bounty должен ссылаться на **новый публичный GitHub Issue** (уникальная пара `repo + issue_number`). Отмененный или выплаченный Issue нельзя повторно профинансировать в текущем контракте.
- Стоимость: reward + фиксированный постоянный резерв `0.08 Testnet NEAR` за каждый новый bounty. Неизрасходованная награда отмененного OPEN bounty возвращается по контрактной логике; резерв не возвращается.
- У исполнителя может быть максимум один APPROVED / pending withdrawal bounty одновременно в P0 контракте; после завершения выплаты можно перейти к следующему.
- Не используйте скриншоты из тестового `scripts/ui-live-multi-test.py` как подтверждение реальных выплат: в тесте состояния GitHub/RPC/кошелька **имитируются**.

## Быстрое применение патча на Mac

Из каталога существующего проекта (например `/Users/alexdarkwing/Downloads/the-last-patch 2`):

```bash
# Остановить npm start клавишами Ctrl+C
unzip -o ~/Downloads/THE_LAST_PATCH_MULTI_BOUNTY_PATCH.zip -d .

export CONTRACT_ID="lastpatch.intent.testnet"
export NEAR_RPC="https://rpc.testnet.fastnear.com"

npm test
npm start
```

Затем открыть `http://localhost:8080/live`, нажать **+ CREATE NEW BOUNTY**, вставить **НОВЫЙ** публичный GitHub Issue, указать название, район, награду, нажать **FUND NEW BOUNTY** и подписать транзакцию. Затем `REFRESH` и выбрать новый bounty в списке.

**Не запускайте `scripts/deploy-testnet.sh` повторно.** Контракт уже задеплоен и инициализирован. Патч не меняет контракт или ключи.

## Для публикации

```bash
export CONTRACT_ID="lastpatch.intent.testnet"
export NEAR_RPC="https://rpc.testnet.fastnear.com"
npm run build
cat dist/config.json
```

В `dist/config.json` должны быть `contractId=lastpatch.intent.testnet` и чистый URL RPC без Markdown-разметки. Загрузить содержимое `dist/` на статический HTTPS-хостинг. Для Netlify в `public/_redirects` включено правило маршрутизации `/live`, `/sample`.

## Выполненные проверки

- `npm test`: 17/17 JS-тестов прошли.
- `scripts/ui-live-multi-test.py`: тест с **МОК** RPC/кошельком проверил выбор CANCELLED/PAID, создание #4 и #5 при активном #4, отсутствие ошибок JS. Это не реальный сетевой testnet E2E.
- Реальные браузерные подписи новой сборки и создание очередного bounty на `lastpatch.intent.testnet` должны быть проверены пользователем, так как приватные ключи находятся только в его кошельке.
