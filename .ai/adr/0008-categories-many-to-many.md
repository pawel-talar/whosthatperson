# ADR 0008: Kategorie jako relacja wiele‑do‑wielu

Data: 2026-01-31

## Kontekst
Jedna postać może pasować do wielu kategorii (np. „film” i „polska”).

## Decyzja
Wprowadzamy tabelę łączącą `person_category`:
- `person_id` → `persons.id`
- `category_code` → `category.code`
- PK złożony (`person_id`, `category_code`)

## Uzasadnienie
- Elastyczne przypisywanie wielu kategorii do jednej osoby.
- Prostsze filtrowanie w API i multiplayerze.

## Konsekwencje
- Filtrowanie po kategorii realizowane jest przez JOIN do `person_category`.
- Migracje muszą zainicjalizować dane relacyjne.
