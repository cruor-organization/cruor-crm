# Makefile — atalhos legíveis para os comandos do monorepo.
# Cada target delega nos scripts do package.json da raiz (uma só fonte de
# verdade) ou na CLI do Supabase. Correr a partir da raiz do repo.

# Usa bash e pára à primeira falha dentro de uma receita.
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help

.PHONY: help install up down dev backend frontend ai \
        supabase-start supabase-stop \
        db-migrate db-migrate-dev db-reset db-studio \
        lint typecheck test format format-check build

## help: lista os targets disponíveis
help:
	@echo "Cruor — comandos do monorepo:"
	@echo
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'

# ── Setup ────────────────────────────────────────────────────────────────

## install: instala dependências nas 3 apps (backend, frontend, ai-service)
install:
	pnpm install:all

# ── Dev ──────────────────────────────────────────────────────────────────

## up: completo — arranca o Supabase e depois as 3 apps
up: supabase-start dev

## down: pára o Supabase
down: supabase-stop

## dev: corre backend + frontend + ai-service em paralelo
dev:
	pnpm dev

## backend: corre só o backend (:3001)
backend:
	pnpm dev:backend

## frontend: corre só o frontend (:5173)
frontend:
	pnpm dev:frontend

## ai: corre só o ai-service (:3002)
ai:
	pnpm dev:ai

## supabase-start: arranca o Supabase local (Postgres + serviços)
supabase-start:
	pnpm supabase:start

## supabase-stop: pára o Supabase local
supabase-stop:
	pnpm supabase:stop

# ── Base de dados ────────────────────────────────────────────────────────

## db-migrate: aplica as migrations pendentes (modo deploy)
db-migrate:
	pnpm db:migrate

## db-migrate-dev: cria e aplica uma migration em desenvolvimento
db-migrate-dev:
	pnpm db:migrate:dev

## db-reset: faz reset à base de dados e re-aplica as migrations
db-reset:
	pnpm db:reset

## db-studio: abre o Prisma Studio
db-studio:
	pnpm db:studio

# ── Qualidade ────────────────────────────────────────────────────────────

## lint: corre o eslint nas 3 apps
lint:
	pnpm lint

## typecheck: corre o tsc nas 3 apps
typecheck:
	pnpm typecheck

## test: corre os testes (backend + ai-service)
test:
	pnpm test

## format: formata o repo com o prettier
format:
	pnpm format

## format-check: verifica a formatação sem alterar ficheiros
format-check:
	pnpm format:check

# ── Build ────────────────────────────────────────────────────────────────

## build: faz o build das 3 apps
build:
	pnpm build
