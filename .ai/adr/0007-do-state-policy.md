# ADR 0007: Polityka stanu w Durable Object

Data: 2026-01-31

## Kontekst
Stan pokoju musi być spójny i kontrolowany centralnie.

## Decyzja
- Stan pokoju przechowywany w Durable Object (Storage).
- Reset lobby czyści stan rund i wyniki.
- Pokoje nie są trwałe bez aktywności (brak gwarantowanej retencji).

## Uzasadnienie
- Prosty model zarządzania stanem bez zewnętrznej bazy.
- Szybka synchronizacja z WebSocket.

## Konsekwencje
- Po dłuższej nieaktywności pokój może zostać utracony.
- W przyszłości można dodać retencję lub storage zewnętrzny.
