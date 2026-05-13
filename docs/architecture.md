# Arquitetura — visão de serviços (§11)

```
                           ┌──────────────────────┐
                           │       Browser        │
                           │ (florista interno)   │
                           └──────────┬───────────┘
                                      │ HTTPS + session cookie
                                      ▼
                           ┌──────────────────────┐
                           │  apps/frontend (Vite)│
                           │  React 18 + TanStack │
                           └──────────┬───────────┘
                                      │ fetch /api/*
                                      ▼
        ┌──────────────────┐    ┌──────────────────────┐    ┌──────────────────┐
        │  Resend (email)  │◀───┤  apps/backend Express│───▶│  apps/ai-service │
        │  Evolution (WA)  │    │   • Better Auth       │ HMAC │  LangChain (4+) │
        │  Stripe / Moloni │    │   • Prisma ORM        │    │  pgvector        │
        │  CTT/DPD/Chrono  │    │   • BullMQ (Phase 2+) │    └──────────────────┘
        └──────────────────┘    └──────────┬───────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  Supabase Postgres 16    │
                              │   + pgvector             │
                              └──────────────────────────┘
```

## Comunicação

- **Frontend ↔ Backend**: HTTPS + cookie de sessão Better Auth. CORS allowlist em `FRONTEND_URL`. CSRF: token sincronizado (Phase 1+ em mutations).
- **Backend ↔ AI Service**: HMAC HTTP (header `X-CRM-Signature` com `BACKEND_HMAC_SECRET`). Implementado em Phase 4.
- **Filas**: BullMQ + Redis. Filas declaradas em §11 do prompt: `embeddings`, `scraping`, `catalog-pdf`, `email`, `alibaba-sync`, `stock-forecast`, `churn-detection`, `campaign-send`, `invoice-issue`.

## Deploy

- **Coolify** (§0). `docker/docker-compose.prod.yml` é o alvo.
- Postgres é externo (Supabase Cloud). Redis sobe junto às apps em Phase 2+ quando BullMQ entrar.

## Estado em Fase 0

Frontend ↔ Backend ↔ Postgres está vivo. AI Service é stub sem dependências. Filas, Redis, integrações externas (Resend, Evolution, etc.) entram nas fases respetivas (§15).
