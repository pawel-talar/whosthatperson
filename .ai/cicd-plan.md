# CI/CD Plan

Data: 2026-02-01

## CI
- Workflow `ci.yml` uruchamiany na PR i push (poza main).
- Job `test`: install -> build -> unit tests (Vitest) -> npm audit.
- Job `e2e`: install -> build -> migracje D1 (local) -> Playwright E2E.

## CD
- Workflow `cloudflare-deploy.yml` na gałęzi `main`.
- Kroki: install -> build -> unit tests -> E2E (local) -> migracje D1 (remote) -> deploy Worker.

## Sekrety
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_DATABASE_ID` (jeśli wymagane w configu)
