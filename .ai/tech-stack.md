# Tech Stack

## Frontend
- **Astro**: framework SSR/SSG, routing i API w jednym projekcie.
- **React**: komponenty UI, logika gry i lobby.
- **Tailwind CSS**: szybkie budowanie spójnych layoutów.

## Backend / Runtime
- **Cloudflare Workers**: uruchamianie API i SSR na edge.
- **Durable Objects**: spójny stan multiplayer i WebSocket.
- **WebSocket**: realtime komunikacja w lobby i rundach.

## Dane
- **Cloudflare D1 (SQLite)**: trwałe przechowywanie osób do quizu.
- **Migracje SQL**: schemat i seed danych w repozytorium.

## Tooling
- **Wrangler**: dev i deploy do Cloudflare.
- **TypeScript**: typy i bezpieczeństwo w całym stacku.

## Dlaczego ten stack?
- SSR + API w jednym miejscu.
- Minimalna infrastruktura backendu.
- Niskie opóźnienia i skalowalność dla multiplayer.
