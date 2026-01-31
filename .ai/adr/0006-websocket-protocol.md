# ADR 0006: WebSocket i protokół zdarzeń

Data: 2026-01-31

## Kontekst
Multiplayer wymaga synchronicznej wymiany stanu i wyników w czasie rzeczywistym.

## Decyzja
- Komunikacja odbywa się przez WebSocket do Durable Object.
- Serwer publikuje `roomUpdate` jako źródło prawdy stanu pokoju.
- Klienci wysyłają zdarzenia typu `joinRoom`, `guess`, `startGame`, `nextRound`.

## Uzasadnienie
- Minimalizacja sporów o stan i punkty.
- Prosty model synchronizacji klientów.

## Konsekwencje
- Klient jest „thin”, renderuje stan z serwera.
- Ewentualne zmiany protokołu wymagają spójnej aktualizacji klienta i DO.
