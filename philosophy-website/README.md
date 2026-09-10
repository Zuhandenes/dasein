# Сайт-визитка философского консультанта — Андрей Леман

Лендинг + запись на сессии с онлайн-оплатой.

- **Стек:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, Prisma + PostgreSQL.
- **Оплата:** эквайринг **T-Bank** («Т‑Касса», Tinkoff Acquiring API v2) — `Init` → редирект на страницу банка → подтверждение по вебхуку `Notification`. Есть режим `manual` без онлайн-оплаты.
- **Календарь:** свободные слоты = шаблон доступности − занятость Google Calendar − уже созданные брони. Google Calendar опционален.
- **Уведомления:** Telegram-бот + email (Resend или SMTP).

## Структура

```
app/
  page.tsx                  Лендинг (био, услуги, обо мне, отзывы, CTA)
  services/page.tsx         Подробно об услугах
  about/page.tsx            Расширенное «обо мне» (задел, TODO)
  booking/page.tsx          Запись: услуга → слот → форма → оплата
  booking/success|fail/     Страницы результата оплаты (с опросом статуса)
  api/
    availability/           GET — свободные слоты
    bookings/               POST — создать бронь + платёж; GET /[id] — статус
    payments/tbank/         POST — вебхук T-Bank
components/                 UI, секции лендинга, форма записи
content/                    ВЕСЬ редактируемый контент: site, services, testimonials, availability
lib/                        slots (генерация), tbank, google-calendar, telegram, email, booking-service
prisma/schema.prisma        Модель Booking
scripts/confirm-booking.ts  Ручное подтверждение оплаты
```

## Запуск локально

```bash
make setup      # .env + Postgres в Docker + npm install + миграции
make dev        # http://localhost:3000
```

`make help` — все команды. Без make то же руками:

```bash
cp .env.example .env            # для локальной разработки хватит дефолтов
docker compose up -d db         # PostgreSQL на localhost:5432
npm install
npx prisma migrate dev          # создать таблицы
npm run dev                     # http://localhost:3000
```

`INTEGRATIONS_TEST_MODE=true` (в `.env.example` по умолчанию) — не ходить в T-Bank/Telegram/почту,
писать всё в консоль. Кнопка оплаты в этом режиме сразу ведёт на `/booking/success?...&test=1`.

### Тесты и проверка

```bash
make test       # vitest: генерация слотов + подпись T-Bank
make check      # тесты + прод-сборка (гонять перед пушем)
```

## Что нужно от Андрея (перед публикацией)

Всё помечено `TODO` в `content/*.ts`:

- реальное фото → `public/andrey.jpg`, поменять `site.hero.photo.src`;
- точные ссылки: Telegram-канал, подкаст, 3 избранные лекции;
- цены и форматы услуг (`content/services.ts`), тексты для «Преподавания», «Беседы вдвоём», «Аналитики мировоззрения»;
- реальные отзывы (`content/testimonials.ts`);
- реквизиты для оферты/эквайринга (`site.legal`);
- расписание доступности (`content/availability.ts`).

## Переменные окружения

См. `.env.example`. Ключевое для продакшена:

| Переменная | Зачем |
|---|---|
| `DATABASE_URL` | Postgres (Neon / Vercel Postgres) |
| `NEXT_PUBLIC_SITE_URL` | абсолютный адрес сайта (для ссылок оплаты и вебхука) |
| `PAYMENT_MODE` | `tbank` или `manual` |
| `TBANK_TERMINAL_KEY`, `TBANK_PASSWORD` | боевой терминал T-Bank |
| `TBANK_RECEIPT_ENABLED`, `TBANK_TAXATION`, `TBANK_VAT` | чек по 54-ФЗ, если требуется фискализация |
| `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CALENDAR_ID` | синхронизация календаря (опционально) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | уведомления в Telegram |
| `RESEND_API_KEY` **или** `SMTP_*` | отправка писем |
| `MAIL_FROM`, `MAIL_ADMIN` | адрес отправителя и адрес администратора |
| `INTEGRATIONS_TEST_MODE` | `true` — заглушки вместо реальных интеграций |

## Деплой на Vercel

1. Подключить репозиторий, Root Directory → `philosophy-website`.
2. Создать БД (Neon / Vercel Postgres), задать `DATABASE_URL`.
3. Прописать остальные переменные окружения.
4. Миграции на Vercel применяются автоматически: при сборке выполняется скрипт `vercel-build`
   (`prisma generate && prisma migrate deploy && next build`). Вне Vercel — `DATABASE_URL="<боевая>" make migrate-prod`.
5. В личном кабинете T-Bank указать адрес вебхука: `https://<домен>/api/payments/tbank`.
6. Расшарить нужный Google-календарь на email сервисного аккаунта (право «Внесение изменений в мероприятия»).

## Настройка T-Bank

- Тестовый терминал даёт T-Bank в кабинете; на нём удобно прогнать полный сценарий.
- Вебхук должен отвечать строкой `OK` — это уже реализовано в `app/api/payments/tbank/route.ts`.
- Подпись (`Token`) проверяется в `lib/tbank.ts` (`verifyTbankToken`).
- Одностадийная схема: платёж считается успешным при статусе `CONFIRMED`.

## Настройка Google Calendar

1. Google Cloud → создать проект → включить Google Calendar API.
2. Создать сервисный аккаунт, скачать JSON-ключ.
3. `GOOGLE_SERVICE_ACCOUNT_JSON` = содержимое ключа одной строкой (или base64).
4. Открыть нужный календарь → «Настройки и доступ» → дать доступ email сервисного аккаунта.
5. `GOOGLE_CALENDAR_ID` — обычно это адрес календаря (email).

Если переменные не заданы — сайт работает: слоты берутся из шаблона и уже созданных броней.
