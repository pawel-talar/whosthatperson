# DB Plan

Data: 2026-02-01

## Silnik
- Cloudflare D1 (SQLite)

## Tabele
- `persons` (id, name, occupation, hints, category)
- `category` (code, label)
- `person_category` (person_id, category_code)

## Relacje
- `persons` ↔ `category` przez `person_category` (wiele-do-wielu)

## Migracje
- Schema + seed (migrations/0001-0007)

## Użycie
- Publiczne API korzysta z kategorii.
- Admin CRUD zapisuje osoby i przypisania kategorii.
- E2E uruchamia migracje lokalne przed testami.
