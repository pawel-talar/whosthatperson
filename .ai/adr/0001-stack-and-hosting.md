# ADR 0001: Stack i hosting

Data: 2026-01-31

## Kontekst
Projekt wymaga SSR (endpointy `/api/*`) i real‑time (WebSocket) dla multiplayer.

## Decyzja
Wybieramy Astro + React + Tailwind po stronie UI oraz Cloudflare Workers/Pages jako hosting z API.

## Uzasadnienie
- Astro obsługuje SSR i endpointy API w jednym projekcie.
- React daje prosty rozwój UI gry.
- Cloudflare Workers/Pages zapewnia szybkie edge‑deployments i WebSocket.

## Konsekwencje
- Lokalny dev powinien używać `wrangler dev` (bindingi dla Workers).
- Deployment wymaga konfiguracji `wrangler.jsonc`.
