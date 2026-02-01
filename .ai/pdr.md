# Product/Project Design Requirements (PDR)

Data: 2026-02-01

## 1. Cel produktu
Stworzenie gry quizowej „Who’s That Person?” z trybem solo i multiplayer, działającej w przeglądarce, z prostą mechaniką punktacji i podpowiedzi oraz panelem admina do zarządzania treściami.

## 2. Zakres
### W ramach MVP
- Singleplayer: 5 pytań, punkty, timer, podpowiedzi.
- Multiplayer: lobby, wspólne rundy, ranking.
- Panel admina pod `/admin`.
- Brak kont i logowania dla graczy.
- Dane w Cloudflare D1.

### Poza zakresem
- Zarządzanie użytkownikami i profilami.
- Zaawansowane dopasowanie odpowiedzi (fuzzy/NLP).

## 3. Użytkownicy i przypadki użycia
- Gracz solo: szybka rozgrywka.
- Host: tworzy pokój i startuje rundy.
- Gracz multiplayer: dołącza linkiem i zgaduje w czasie rzeczywistym.
- Admin: dodaje/edytuje/usuwa osoby i kategorie.

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
- Dostęp do `/admin` i `/api/admin/*` chroniony przez Cloudflare Access.
- Dodawanie/edycja/usuwanie osób.
- Dodawanie/edycja/usuwanie kategorii.
- Wylogowanie przez `/cdn-cgi/access/logout`.

### API
- `GET /api/persons`
- `GET /api/random-person?category=testowa`
- `GET /api/categories`
- `POST /api/room`
- `GET /api/room/:id`
- `WS /api/room/:id/ws`
- `GET/POST/PUT/DELETE /api/admin/...`

## 5. Wymagania niefunkcjonalne
- SSR/edge runtime (Workers).
- Responsywne UI.
- Spójność stanu multiplayer (źródło prawdy po stronie serwera).
- Autoryzacja admina realizowana przez Cloudflare Access.

## 6. Dane i przechowywanie
- Cloudflare D1 (SQLite).
- Migracje SQL: schema + seed.
- Brak danych wrażliwych (nicki tymczasowe).

## 7. Architektura (wysoki poziom)
- UI: Astro + React + Tailwind.
- Backend: Astro API + Durable Objects (WebSocket).
- Dane: D1.

## 8. Integracje i środowisko
- Cloudflare Workers + D1 + Durable Objects.
- Cloudflare Access dla `/admin` i `/api/admin/*`.
- Lokalny dev przez `wrangler dev` (Access pomijany dla localhost).

## 9. Punkty jakości i ryzyka
### Ryzyka
- Stabilność WebSocket w środowisku edge.
- Zależność od konfiguracji Cloudflare Access dla admina.
- Błędy konfiguracji D1 (database_id).

### Kontrola jakości
- Testy automatyczne w CI (Vitest + Playwright).
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
