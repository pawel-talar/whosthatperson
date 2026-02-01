# ADR 0009: Admin Access

## Status
Accepted

## Context
Panel admina wymaga ochrony na produkcji. Projekt działa na Cloudflare Workers.

## Decision
- Chronimy `/admin` oraz `/api/admin/*` przez Cloudflare Access.
- W lokalnym środowisku Access jest pomijany dla `localhost`/`127.0.0.1`.
- Wylogowanie przez `/cdn-cgi/access/logout`.

## Consequences
- Dostęp do admina zależy od poprawnej konfiguracji Access.
- Brak nagłówków `Cf-Access-*` w produkcji skutkuje 401.
