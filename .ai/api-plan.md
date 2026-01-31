# API Plan

Data: 2026-01-31

## Cel
Zapewnienie spójnego API REST + WebSocket dla gry.

## Zakres
- Endpointy publiczne do danych quizu.
- Endpointy do zarządzania pokojami multiplayer.
- WebSocket do synchronizacji stanu.

## REST Endpoints
1. `GET /api/persons`
   - Zwraca wszystkie postacie.
   - Zawiera listę `categories` powiązanych z osobą.
2. `GET /api/random-person?category=Testowa`
   - Zwraca losową postać (filtrowanie po `person_category`).
3. `POST /api/room`
   - Tworzy pokój, zwraca `roomId`, `hostKey`, `inviteUrl`.
4. `GET /api/room/:id`
   - Zwraca publiczny stan pokoju.

## WebSocket
- `WS /api/room/:id/ws`
  - Wysyłane zdarzenia: `joinRoom`, `guess`, `startGame`, `nextRound`, `setConfig`, `resetLobby`.
  - Odbierane zdarzenia: `roomUpdate`, `guessResult`, `joined`.

## Zasady
- Serwer (DO) jest źródłem prawdy dla punktów i stanu.
- Klient renderuje stan na podstawie `roomUpdate`.
- Kategorie w multiplayer są wybierane przez hosta (Mix lub konkretna kategoria).

## Checklist
- [ ] Obsługa błędów w API
- [ ] Spójna struktura payloadów
- [ ] Timeouty i zakończenie rundy w DO
