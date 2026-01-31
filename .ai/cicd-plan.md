# CI/CD Plan

Data: 2026-01-31

## Cel
Automatyzacja walidacji kodu i deployu na Cloudflare.

## CI (weryfikacja jakości)
- Trigger: PR do `main` oraz push na inne branche.
- Kroki:
  - `npm ci`
  - `npm run build`
  - `npm audit --omit=dev`

## CD (deploy)
- Trigger: push na `main`.
- Kroki:
  - `npm ci`
  - `npm run build`
  - `wrangler d1 migrations apply whosthatperson --remote`
  - `wrangler deploy`

## Sekrety
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Uwagi
- Migracje D1 muszą być idempotentne.
- Brak deployu z PR (tylko `main`).
