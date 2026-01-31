# Who's That Person?

MVP prostej gry quizowej zbudowanej w Astro + React + Tailwind.
Dane startowe są seedowane do Cloudflare D1 z migracji SQL.

## Wymagania

- Node.js >= 18.20.8 (Astro 5 wymaga nowszej wersji niż 18.16)
- npm

## Uruchomienie

```sh
npm install
npm run d1:apply:local
npm run dev:workers
```

Domyślnie aplikacja działa na http://localhost:4321 (przez Workers).

## Endpointy API

- `GET /api/persons` — lista wszystkich postaci (z `categories`)
- `GET /api/random-person?category=testowa` — losowa postać (kategoria opcjonalna)
- `GET /api/categories` — lista kategorii
- `POST /api/room` — tworzenie lobby
- `GET /api/room/:id` — stan pokoju
- `WS /api/room/:id/ws` — realtime multiplayer

## Struktura

- `src/pages/index.astro` — strona główna z osadzonym komponentem React
- `src/components/Game.tsx` — logika gry
- `src/pages/api/persons.ts` — endpoint z listą postaci
- `src/pages/api/random-person.ts` — endpoint z losową postacią
- `src/pages/api/categories.ts` — endpoint z kategoriami
- `src/types/person.ts` — typ `Person`
- `src/styles/global.css` — style globalne + Tailwind
- `migrations/0001_create_persons.sql` — schemat D1
- `migrations/0002_seed_persons.sql` — dane startowe do D1
- `migrations/0003_seed_film_persons.sql` — dane filmowe
- `migrations/0004_add_category_table.sql` — tabela kategorii + FK
- `migrations/0005_seed_real_persons.sql` — dane realnych osób (30/kategoria)
- `migrations/0006_add_person_categories.sql` — relacja wiele‑do‑wielu
- `migrations/0007_expand_hints_to_5.sql` — rozbudowa hintów do 5
- `.ai/` — dokumentacja projektu (ADR, PDR, kontekst)

## Deploy na Cloudflare Workers

Ta aplikacja używa endpointów `/api/*`, więc wymaga trybu server/SSR.
Upewnij się, że w `wrangler.jsonc` ustawisz poprawne `database_id` dla D1.

1) Wykonaj migracje D1:
```sh
npm run d1:apply
```
1) Zbuduj projekt:
```sh
npm run build
```
2) Zdeployuj worker:
```sh
npx wrangler deploy
```

Konfiguracja deployu znajduje się w `wrangler.jsonc`.
