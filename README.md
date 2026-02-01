# Who's That Person?

Przeglądarkowa gra quizowa, w której gracze zgadują znane osoby na podstawie kolejnych podpowiedzi.
Projekt zawiera tryb singleplayer i multiplayer (lobby + wspólne rundy) oraz panel admina do zarządzania osobami i kategoriami.
Całość działa na Cloudflare Workers (SSR) z bazą D1 i Durable Objects dla realtime.

## Wymagania

- Node.js >= 18.20.8 (Astro 5 wymaga nowszej wersji niż 18.16)
- npm

## Uruchomienie lokalne

```sh
npm install
npm run d1:apply:local
npm run dev:workers
```

`npm run dev` uruchamia Astro dev server.
`npm run dev:workers` uruchamia build + `wrangler dev` (SSR).

Domyślny adres: http://localhost:4321.

## Testy

```sh
npm run test
npm run test:e2e
```

- `npm run test` — unit + testy API (Vitest).
- `npm run test:e2e` — Playwright, uruchamia lokalny `wrangler dev --local` i stosuje migracje D1.

## AI usage

W trakcie pracy wykorzystywałem asystenta AI (ChatGPT/Codex) do planowania, refaktoryzacji, generowania testów oraz weryfikacji rozwiązań.

## Panel admina

- Panel działa pod `/admin`.
- API admina działa pod `/api/admin/*`.
- Produkcja wymaga Cloudflare Access (nagłówki `Cf-Access-*`).
- Lokalnie Access jest pomijany dla `localhost`/`127.0.0.1`.
- Wylogowanie: `GET /cdn-cgi/access/logout`.

### Troubleshooting Cloudflare Access

- 401 na produkcji: upewnij się, że Access chroni zarówno `/admin*`, jak i `/api/admin*`.
- Brak nagłówków `Cf-Access-*`: sprawdź, czy żądanie przechodzi przez Access (Network → Headers).
- Pętla przekierowań: usuń cookies, wyłącz blokowanie ciasteczek lub użyj własnej domeny zamiast `workers.dev`.

## Endpointy API

Public:
- `GET /api/persons` — lista wszystkich postaci (z `categories`)
- `GET /api/random-person?category=testowa` — losowa postać (kategoria opcjonalna)
- `GET /api/categories` — lista kategorii
- `POST /api/room` — tworzenie lobby
- `GET /api/room/:id` — stan pokoju
- `WS /api/room/:id/ws` — realtime multiplayer

Admin (chronione Access):
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:code`
- `DELETE /api/admin/categories/:code`
- `GET /api/admin/persons?limit=20&offset=0&q=...`
- `POST /api/admin/persons`
- `PUT /api/admin/persons/:id`
- `DELETE /api/admin/persons/:id`

## Struktura

- `src/pages/index.astro` — strona główna z osadzonym komponentem React
- `src/components/Game.tsx` — logika gry
- `src/pages/admin/index.astro` — widok panelu admina
- `src/components/AdminDashboard.tsx` — UI admina
- `src/pages/api/persons.ts` — endpoint z listą postaci
- `src/pages/api/random-person.ts` — endpoint z losową postacią
- `src/pages/api/categories.ts` — endpoint z kategoriami
- `src/pages/api/admin/*` — API admina (CRUD)
- `src/types/person.ts` — typ `Person`
- `src/styles/global.css` — style globalne + Tailwind
- `migrations/0001_create_persons.sql` — schemat D1
- `migrations/0002_seed_persons.sql` — dane startowe do D1
- `migrations/0003_seed_film_persons.sql` — dane filmowe
- `migrations/0004_add_category_table.sql` — tabela kategorii + FK
- `migrations/0005_seed_real_persons.sql` — dane realnych osób (30/kategoria)
- `migrations/0006_add_person_categories.sql` — relacja wiele-do-wielu
- `migrations/0007_expand_hints_to_5.sql` — rozbudowa hintów do 5
- `.ai/` — dokumentacja projektu (ADR, PDR, kontekst)

## Deploy na Cloudflare Workers

Ta aplikacja używa endpointów `/api/*`, więc wymaga trybu server/SSR.
Upewnij się, że w `wrangler.jsonc` ustawisz poprawne `database_id` dla D1.

1) Wykonaj migracje D1:
```sh
npm run d1:apply
```
2) Zbuduj projekt:
```sh
npm run build
```
3) Zdeployuj worker:
```sh
npx wrangler deploy
```

Konfiguracja deployu znajduje się w `wrangler.jsonc`.
