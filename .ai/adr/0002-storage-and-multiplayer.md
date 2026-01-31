# ADR 0002: Źródło danych i multiplayer

Data: 2026-01-31

## Kontekst
Projekt potrzebuje trwałego źródła danych dla osób w quizie oraz spójnego stanu gry multiplayer.

## Decyzja
- Dane quizu przechowywane w Cloudflare D1 (SQLite), seedowane migracją.
- Multiplayer zarządzany przez Durable Object jako centralne źródło prawdy (stan pokoju).
- Kategorie wspierają relację wiele‑do‑wielu przez tabelę `person_category`.

## Uzasadnienie
- D1 upraszcza migracje i query bez zewnętrznego serwera.
- Durable Objects zapewniają spójność stanu i prosty model WebSocket.

## Konsekwencje
- Endpointy `/api/*` czytają dane wyłącznie z D1.
- Wymagane są migracje D1 przed uruchomieniem.
- Filtrowanie po kategorii wykorzystuje `person_category`.
