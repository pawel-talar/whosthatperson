# Test Plan

Data: 2026-02-01

## Cel
Zapewnienie, że build przechodzi, API działa poprawnie i kluczowe scenariusze gry/admina są stabilne przed merge do `main` i deployem.

## Zakres testów (automatyczne)

### 1) Build i lint (CI)
- `npm run build`
- (opcjonalnie) `npm run lint` jeśli dodamy ESLint

### 2) Testy jednostkowe (Vitest)
Zaimplementowane:
- `maskName` — maskowanie znaków, spacje i myślniki.

Do dodania:
- `RoomDurableObject` — logika końca rundy po czasie, naliczanie punktów, wybór kategorii.
- `admin payload validation` — minimalna liczba hintów, min. 1 kategoria.

### 3) Testy API (Playwright lub supertest)
Zaimplementowane (Vitest, mock DB):
- `GET /api/categories` → 200 + lista.
- `GET /api/random-person?category=film` → 200 + person z category=film.

Do dodania:
- `GET /api/admin/persons` → 401 bez Access (prod mode), 200 w DEV (local bypass).

### 4) Testy E2E (Playwright)
Zaimplementowane:
- Home: ładowanie strony głównej.
- Admin: ładowanie panelu admina.

Do dodania:
- Admin: dodanie kategorii i osoby, potem edycja i usunięcie.
- Multiplayer: utworzenie lobby, join 2 graczy, start rundy, poprawna odpowiedź → ranking.

## GitHub Actions

### Workflow CI (PR + push non-main)
- Install dependencies
- Build
- Unit tests (Vitest)
- API tests (node)

### Workflow Deploy (main)
- Install dependencies
- Build
- Unit tests (Vitest)
- API tests (node)
- D1 migrations (remote)
- Deploy worker

## Uwagi
- Dla testów API i E2E w CI potrzebny jest tryb local (wrangler dev / miniflare).
- Dla Access używać DEV bypass lub mockować nagłówki.
