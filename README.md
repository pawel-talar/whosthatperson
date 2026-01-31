# Who's That Person?

MVP prostej gry quizowej zbudowanej w Astro + React + Tailwind.
Wszystko działa na mockowanych danych w pamięci, bez logowania i bazy danych.

## Wymagania

- Node.js >= 18.20.8 (Astro 5 wymaga nowszej wersji niż 18.16)
- npm

## Uruchomienie

```sh
npm install
npm run dev
```

Domyślnie aplikacja działa na http://localhost:4321

## Endpointy API

- `GET /api/persons` — lista wszystkich postaci
- `GET /api/random-person?category=Testowa` — losowa postać (kategoria opcjonalna)

## Struktura

- `src/pages/index.astro` — strona główna z osadzonym komponentem React
- `src/components/Game.tsx` — logika gry
- `src/pages/api/persons.ts` — endpoint z listą postaci
- `src/pages/api/random-person.ts` — endpoint z losową postacią
- `src/data/mockPersons.ts` — mockowane dane
- `src/types/person.ts` — typ `Person`
- `src/styles/global.css` — style globalne + Tailwind

## Deploy na Cloudflare Workers

Ta aplikacja używa endpointów `/api/*`, więc wymaga trybu server/SSR.

1) Zbuduj projekt:
```sh
npm run build
```
2) Zdeployuj worker:
```sh
npx wrangler deploy
```

Konfiguracja deployu znajduje się w `wrangler.jsonc`.
