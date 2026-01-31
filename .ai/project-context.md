# Project Context

## Cel produktu
„Who’s That Person?” to quiz, w którym gracze zgadują postacie na podstawie podpowiedzi.

## Zakres MVP
- Tryb singleplayer (5 pytań, punkty, timer).
- Tryb multiplayer z lobby i rankingiem.
- Brak logowania i kont użytkowników.
- Dane quizu w D1.

## Poza zakresem (na teraz)
- Logowanie, profile, historia użytkowników.
- Fuzzy matching odpowiedzi i NLP.
- Skalowanie na wiele regionów z replikacją stanu.

## Użytkownicy i przypadki użycia
- Gracz solo: szybka rozgrywka z punktacją i timerem.
- Host multiplayer: tworzenie pokoju i start rund.
- Gracz multiplayer: dołączanie linkiem i rywalizacja w czasie rzeczywistym.

## Stos technologiczny
- Astro + React + Tailwind.
- Cloudflare Workers + Durable Objects.
- Cloudflare D1 (SQLite).

## Architektura (wysoki poziom)
- UI: React w Astro.
- API: `/api/persons`, `/api/random-person`, `/api/room/*`.
- Multiplayer: WebSocket → Durable Object (Room).

## Model danych (skrót)
- `persons`: id, name, category, occupation, hints[]
- `category`: code, label
- `person_category`: person_id, category_code
- `Room` (DO): players, scores, current person, timer, round history

## API (skrót)
- `GET /api/persons` — lista postaci (z `categories`)
- `GET /api/random-person?category=testowa` — losowa postać
- `POST /api/room` — tworzenie lobby
- `GET /api/room/:id` — stan pokoju
- `WS /api/room/:id/ws` — realtime multiplayer

## Dane
Źródłem prawdy dla osób jest D1. Dane startowe dostarczane są przez migracje SQL.
Panel admina jest chroniony przez Cloudflare Access.

## Uruchomienie lokalne (skrót)
1. `npm install`
2. `npm run d1:apply:local`
3. `npm run dev:workers`

## Deploy (skrót)
1. Ustaw `database_id` w `wrangler.jsonc`
2. `npm run d1:apply`
3. `npx wrangler deploy`

## Monitoring i logi (MVP)
- Podstawowe logi z Workers (wrangler tail).
- Brak agregacji błędów (do rozważenia: Sentry).

## Testowanie (MVP)
- Ręczne testy UI oraz API.
- Brak testów automatycznych.

## Bezpieczeństwo i prywatność
- Brak danych osobowych poza nickiem w lobby.
- Brak logowania i przechowywania sesji użytkownika.

## Roadmap (skrót)
- Panel admin do zarządzania pytaniami.
- Więcej kategorii i trybów punktacji.
- Statystyki graczy i historia gier.

## Ryzyka / ograniczenia
- Brak fallbacku na mocki bez D1.
- Multiplayer wymaga stabilnego WS w Workers.
