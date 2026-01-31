# ADR 0003: Maskowanie odpowiedzi

Data: 2026-01-31

## Kontekst
Pierwsza podpowiedź powinna pokazywać wzór odpowiedzi bez ujawniania liter.

## Decyzja
Maskowanie odbywa się po stronie serwera na podstawie `name`:
- litery i spacje → `_`
- pozostałe znaki (np. myślnik, kropka) → zachowane
Format maski to ciąg tokenów oddzielonych spacjami dla czytelności.

## Uzasadnienie
- Spójny format maski niezależnie od źródła danych.
- Wygodny do wyświetlenia na UI (monospace).

## Konsekwencje
- Maskowanie jest generowane w runtime, a nie przechowywane w DB.
