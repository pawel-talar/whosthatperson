# ADR 0009: Dostęp do panelu admina przez Cloudflare Access

Data: 2026-01-31

## Kontekst
Panel `/admin` wymaga uwierzytelnienia bez budowania własnego systemu logowania.

## Decyzja
Wykorzystujemy Cloudflare Access do ochrony ścieżki `/admin`.

## Uzasadnienie
- Brak przechowywania haseł w aplikacji.
- Szybka konfiguracja i gotowe IdP.
- Dostęp kontrolowany na poziomie edge.

## Konsekwencje
- Konfiguracja Access jest poza repozytorium.
- Dostęp do `/admin` wymaga aktywnego konta w IdP.
