# ADR 0005: Migracje D1 i seed danych

Data: 2026-01-31

## Kontekst
Dane początkowe muszą być dostępne w środowiskach lokalnych i produkcyjnych.

## Decyzja
- Schemat D1 utrzymywany w migracjach SQL.
- Dane seedowane przez migrację `0002_seed_persons.sql`.
- Dodatkowy seed dla kategorii i danych realnych osób.
- Relacja wiele‑do‑wielu przez tabelę `person_category`.

## Uzasadnienie
- Deterministyczne, powtarzalne środowiska.
- Brak zależności od mocków runtime.

## Konsekwencje
- Migracje muszą być wykonane przed uruchomieniem aplikacji.
- Aktualizacja danych wymaga nowej migracji.
- Wyszukiwanie po kategoriach opiera się o `person_category`.
