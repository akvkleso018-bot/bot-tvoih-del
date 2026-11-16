# Бот твоих дел

Telegram Mini App — планировщик задач на сегодня с дедлайнами, голосовым вводом,
монетизацией через **Telegram Stars** и фоновым **«Режимом паники»** (назойливые
вечерние напоминания для премиум-пользователей).

- **Бэкенд:** Python 3.10+, aiogram 3, aiohttp (API для Mini App), aiosqlite (SQLite), APScheduler
- **Фронтенд:** React 18 + htm без сборки (статика отдаётся тем же сервером), Telegram WebApp SDK

## Структура

```
bot-tvoih-del/
├── bot/
│   ├── main.py            # точка входа: polling + HTTP + планировщик
│   ├── config.py          # конфиг из .env
│   ├── db.py              # SQLite: users, tasks, payments
│   ├── webapp_api.py      # HTTP API Mini App + валидация initData
│   ├── scheduler_jobs.py  # Режим паники и напоминания
│   └── handlers/
│       ├── start.py       # /start, /app
│       ├── payments.py    # инвойсы Stars, оплата
│       └── admin.py       # /admin /grant /revoke /broadcast
└── webapp/
    ├── index.html
    ├── style.css          # чёрный фон, неон-фиолет, glassmorphism
    └── app.js             # React-приложение
```

## Быстрый старт

1. Установи зависимости:
   ```
   pip install -r requirements.txt
   ```
2. В `.env` уже записан токен бота и админ-ID. Обязательно поменяй:
   - `WEBAPP_URL` — публичный **HTTPS**-адрес приложения (см. ниже).
   - При необходимости `PREMIUM_PRICE_STARS`, `PREMIUM_DAYS`, `TIMEZONE`.
3. Запусти:
   ```
   python -m bot.main
   ```

## HTTPS-адрес для Mini App

Telegram открывает Mini App только по HTTPS. Варианты:

- **Локальная отладка:** `ngrok http 8080` (или `cloudflared tunnel --url http://localhost:8080`),
  затем впиши выданный адрес в `.env`: `WEBAPP_URL=https://xxxx.ngrok-free.app/webapp`
  и перезапусти бота.
- **Прод:** задеплой на любой хостинг с HTTPS (VPS + Caddy/nginx + certbot).

Кнопку «Бот твоих дел» в меню также можно привязать у @BotFather:
`/setmenubutton` → выбрать бота → отправить `WEBAPP_URL`.

## Как работает оплата (Stars)

1. В приложении кнопка «Премиум» → `POST /api/premium/buy` →
   бот создаёт счёт `create_invoice_link(currency="XTR", …)` (провайдер не нужен).
2. Фронт вызывает `window.Telegram.WebApp.openInvoice(link)`.
3. Бот подтверждает `pre_checkout_query` и ловит `successful_payment` —
   премиум продлевается на `PREMIUM_DAYS` дней, событие уходит админу.

Оплата идёт реальными Stars — для теста используй аккаунт со звёздами.

## Монетизация и лимиты

- Бесплатно: до `FREE_TASK_LIMIT` задач в день, один вежливый ремаиндер в 19:00.
- Премиум: безлимит задач, **жёсткие напоминания** за час до дедлайна (каждые 5 минут
  планировщик проверяет горящие задачи) и **Режим паники** — с 20:00 каждые 15 минут
  бот шлёт эмоциональные сообщения, пока задачи на день не закрыты (8 уровней эскалации).

## Админ-команды (ID из `ADMIN_ID`)

| Команда | Описание |
|---|---|
| `/admin` | статистика: пользователи, премиум, задачи, заработанные Stars |
| `/grant <user_id> [дней]` | выдать премиум |
| `/revoke <user_id>` | отозвать премиум |
| `/broadcast <текст>` | рассылка всем пользователям |

## Отладка фронтенда вне Telegram

В `.env` поставь `DEV_BYPASS_AUTH=true` и передавай заголовок `X-Dev-User: <telegram_id>`
(проверка initData отключается). Только для локальной разработки!

## Безопасность

- Токен бота хранится в `.env` — не публикуй его. Если токен где-то «засветился»,
  отзови его у @BotFather (`/revoke`) и выпишите новый.
- Все запросы API Mini App проверяют HMAC-подпись `initData`, поэтому чужой ID
  подделать нельзя.
