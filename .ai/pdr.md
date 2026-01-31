# Product/Project Design Requirements (PDR)

Data: 2026-01-31

## 1. Cel produktu
Stworzenie gry quizowej „Who’s That Person?” z trybem solo i multiplayer, działającej w przeglądarce, z prostą mechaniką punktacji i podpowiedzi.

## 2. Zakres
### W ramach MVP
- Singleplayer: 5 pytań, punkty, timer, podpowiedzi.
- Multiplayer: lobby, wspólne rundy, ranking.
- Panel admina dostępny pod `/admin`.
- Brak kont i logowania dla graczy.
- Dane w Cloudflare D1.

### Poza zakresem
- Zarządzanie użytkownikami i profilami.
- Zaawansowane dopasowanie odpowiedzi (fuzzy/NLP).

## 3. Użytkownicy i przypadki użycia
- Gracz solo: szybka rozgrywka.
- Host: tworzy pokój i startuje rundy.
- Gracz multiplayer: dołącza linkiem i zgaduje w czasie rzeczywistym.
- Admin: dodaje/usuwa osoby i kategorie.

## 4. Wymagania funkcjonalne
### Singleplayer
- Losowanie 5 pytań z kategorii.
- Podpowiedzi odsłaniane sekwencyjnie.
- Punktacja zależna od liczby podpowiedzi i czasu.
- Podsumowanie rozgrywki z listą haseł.

### Multiplayer
- Lobby z linkiem zaproszenia.
- Start gry przez hosta.
- Wspólny stan rundy dla wszystkich graczy.
- Ranking na koniec gry.
- Automatyczne kończenie rundy po czasie lub gdy wszyscy odgadną.
- Wybór kategorii przez hosta (w tym „Mix”).

### Admin
- Dostęp do `/admin` chroniony przez Cloudflare Access.
- Dodawanie i usuwanie osób.
- Dodawanie i usuwanie kategorii.

### API
- `GET /api/persons`
- `GET /api/random-person?category=testowa`
- `GET /api/categories`
- `POST /api/room`
- `GET /api/room/:id`
- `WS /api/room/:id/ws`

## 5. Wymagania niefunkcjonalne
- SSR/edge runtime (Workers).
- Responsywne UI.
- Spójność stanu multiplayer (źródło prawdy po stronie serwera).
- Autoryzacja admina realizowana przez Cloudflare Access.

## 6. Dane i przechowywanie
- Cloudflare D1 (SQLite).
- Migracje SQL: schema + seed.
- Brak danych wrażliwych (nicki są tymczasowe).

## 7. Architektura (wysoki poziom)
- UI: Astro + React + Tailwind.
- Backend: Astro API + Durable Objects (WebSocket).
- Dane: D1.

## 8. Integracje i środowisko
- Cloudflare Workers + D1 + Durable Objects.
- Cloudflare Access dla `/admin`.
- Lokalny dev przez `wrangler dev`.

## 9. Punkty jakości i ryzyka
### Ryzyka
- Brak fallbacku bez D1.
- Stabilność WebSocket w środowiskach edge.
- Zależność od konfiguracji Cloudflare Access dla dostępu do /admin.

### Kontrola jakości
- Testy manualne (MVP).
- Walidacja punktacji po stronie serwera.

## 10. Uruchomienie i deploy (skrót)
### Lokalne
1. `npm install`
2. `npm run d1:apply:local`
3. `npm run dev:workers`

### Produkcja
1. Ustaw `database_id` w `wrangler.jsonc`
2. `npm run d1:apply`
3. `npx wrangler deploy`
