# API Plan

Data: 2026-02-01

## Public API
- `GET /api/persons` — lista postaci z kategoriami.
- `GET /api/random-person?category=...` — losowa postać z kategorii (opcjonalnie).
- `GET /api/categories` — lista kategorii.
- `POST /api/room` — tworzy lobby.
- `GET /api/room/:id` — stan pokoju.
- `WS /api/room/:id/ws` — realtime multiplayer.

## Admin API (Cloudflare Access)
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:code`
- `DELETE /api/admin/categories/:code`
- `GET /api/admin/persons?limit=20&offset=0&q=...`
- `POST /api/admin/persons`
- `PUT /api/admin/persons/:id`
- `DELETE /api/admin/persons/:id`

## Autoryzacja
- W produkcji wymagane nagłówki `Cf-Access-*`.
- Lokalnie Access jest pomijany dla `localhost`/`127.0.0.1`.

## Odpowiedzi
- Listy zwracają JSON z polami `items`, `total`, `limit`, `offset`.
- Walidacja payloadów po stronie serwera (min. 3 hinty, min. 1 kategoria).
