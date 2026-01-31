# ADR 0004: Punktacja i timer

Data: 2026-01-31

## Kontekst
Gra ma nagradzać szybkie i trafne odpowiedzi, a także uwzględniać liczbę podpowiedzi.

## Decyzja
- Singleplayer: punkty bazowe 100, kara za dodatkową podpowiedź, bonus za pozostały czas.
- Multiplayer: serwer nalicza punkty na podstawie liczby podpowiedzi i czasu odpowiedzi.
- Runda kończy się automatycznie po upływie czasu lub gdy wszyscy gracze odgadną hasło.

## Uzasadnienie
- Zachęta do szybkich odpowiedzi.
- Spójne naliczanie na serwerze (brak sporów).

## Konsekwencje
- UI pokazuje tylko wynik, ale nie wylicza punktów.
- Timer jest źródłem prawdy na serwerze w multiplayer.
