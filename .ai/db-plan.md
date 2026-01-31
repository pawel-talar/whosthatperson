# DB Plan

Data: 2026-01-31

## Cel
Utrzymanie danych quizu w Cloudflare D1 oraz spójna migracja schematu i seed danych.

## Zakres
- Tabela `persons` jako źródło prawdy dla quizu.
- Migracje SQL (schema + seed).
- Bez mocków runtime.

## Kroki implementacji
1. Utworzenie schematu D1:
   - `migrations/0001_create_persons.sql` z tabelą `persons`.
2. Seed danych:
   - `migrations/0002_seed_persons.sql` z rekordami osób.
3. Konfiguracja bindingu D1:
   - `wrangler.jsonc` → `d1_databases` + `database_id`.
4. Typy środowiska:
   - `src/env.d.ts` → `DB: D1Database`.
5. Skrypty migracji:
   - `npm run d1:apply` / `npm run d1:apply:local`.

## Struktura danych
Tabela `persons`:
- `id` TEXT PRIMARY KEY
- `name` TEXT NOT NULL
- `category` TEXT NOT NULL
- `occupation` TEXT NOT NULL
- `hints` TEXT NOT NULL (JSON array)

## Zasady
- Migracje są jedynym źródłem danych startowych.
- Każda zmiana danych wymaga nowej migracji.

## Checklist
- [ ] Ustawione `database_id` w `wrangler.jsonc`
- [ ] Migracje applied (local/prod)
- [ ] Endpointy API czytają z D1
