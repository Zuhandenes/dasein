# Сайт-визитка Андрея Лемана — частые команды.
# Запускать из папки philosophy-website:  make <цель>
# Список целей:  make help

SHELL := /bin/bash
.DEFAULT_GOAL := help

# npx через локальные node_modules
NPX := npx --no-install

## ── Первичная настройка ──────────────────────────────────────────────

.PHONY: setup
setup: .env node_modules db-up wait-db migrate ## Поднять всё с нуля (env + БД + зависимости + миграции)
	@echo "✔ Готово. Запускайте:  make dev"

.env: ## Создать .env из шаблона, если его ещё нет
	@test -f .env || (cp .env.example .env && echo "→ создан .env из .env.example")

node_modules: package.json
	npm install
	@touch node_modules

.PHONY: install
install: node_modules ## Установить зависимости

## ── Разработка ───────────────────────────────────────────────────────

.PHONY: dev
dev: ## Dev-сервер (http://localhost:3000)
	$(NPX) next dev

.PHONY: build
build: ## Прод-сборка
	$(NPX) prisma generate && $(NPX) next build

.PHONY: start
start: ## Запустить прод-сборку локально
	$(NPX) next start

.PHONY: lint
lint: ## ESLint
	$(NPX) next lint

.PHONY: test
test: ## Юнит-тесты (vitest)
	npm test

.PHONY: check
check: test build ## Полная проверка перед пушем (тесты + сборка)

## ── База данных ──────────────────────────────────────────────────────

.PHONY: db-up
db-up: ## Поднять Postgres в Docker
	docker compose up -d db

.PHONY: db-down
db-down: ## Остановить Postgres (данные сохраняются)
	docker compose down

.PHONY: db-reset
db-reset: ## Снести БД вместе с данными и накатить схему заново
	docker compose down -v
	docker compose up -d db
	$(MAKE) wait-db
	$(NPX) prisma migrate reset --force

.PHONY: wait-db
wait-db: ## Дождаться готовности Postgres
	@echo -n "Жду Postgres"
	@until docker compose exec -T db pg_isready -U philo -q 2>/dev/null; do echo -n "."; sleep 1; done
	@echo " ок"

.PHONY: migrate
migrate: ## Создать/применить миграцию локально
	$(NPX) prisma migrate dev

.PHONY: migrate-prod
migrate-prod: ## Применить миграции к боевой БД (нужен DATABASE_URL в окружении)
	$(NPX) prisma migrate deploy

.PHONY: studio
studio: ## Prisma Studio — веб-просмотр броней
	$(NPX) prisma studio

## ── Эксплуатация ─────────────────────────────────────────────────────

.PHONY: confirm
confirm: ## Подтвердить оплату брони вручную:  make confirm id=<bookingId>
	@test -n "$(id)" || (echo "Укажите id:  make confirm id=<bookingId>" && exit 1)
	npm run bookings:confirm $(id)

.PHONY: clean
clean: ## Удалить .next и кеши сборки
	rm -rf .next coverage

## ── Деплой ───────────────────────────────────────────────────────────

.PHONY: deploy
deploy: check ## Проверить и задеплоить на Vercel (нужен vercel CLI и линк проекта)
	$(NPX) vercel deploy --prod

## ────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Показать этот список
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
