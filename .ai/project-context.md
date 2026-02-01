# Project Context

Data: 2026-02-01

## Cel
Stworzenie gry „Who’s That Person?” z trybem solo i multiplayer oraz panelu admina do zarządzania treściami quizu.

## Stan projektu
- Astro + React + Tailwind.
- Cloudflare Workers + D1 + Durable Objects.
- Multiplayer przez WebSocket, stan gry po stronie serwera.
- Admin panel pod `/admin` (CRUD person/kategoria), API pod `/api/admin/*`.
- Testy: Vitest (unit), Playwright (E2E).

## Dostęp admina
- Produkcja: Cloudflare Access chroni `/admin` i `/api/admin/*`.
- Lokalnie: Access pomijany dla `localhost`/`127.0.0.1`.
- Wylogowanie: `/cdn-cgi/access/logout`.

## Dane
- D1 z migracjami SQL.
- Tabele: `persons`, `category`, `person_category`.
- Hints przechowywane jako JSON.

## Najważniejsze ścieżki
- UI gry: `src/components/Game.tsx`
- Lobby multiplayer: `src/components/Room.tsx` + `src/durable/RoomDurableObject.ts`
- Admin UI: `src/pages/admin/index.astro` + `src/components/AdminDashboard.tsx`
- Admin API: `src/pages/api/admin/*`
- Testy E2E: `tests/e2e/*`

## Uruchomienie
- Lokalnie: `npm run d1:apply:local` + `npm run dev:workers`.
- Testy E2E: `npm run test:e2e` (startuje lokalny wrangler + migracje).
- Produkcja: `npm run d1:apply` + `npx wrangler deploy`.
