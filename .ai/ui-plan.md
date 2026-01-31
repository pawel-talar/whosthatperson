# UI Plan

Data: 2026-01-31

## Cel
Spójny i czytelny interfejs dla trybu solo i multiplayer.

## Zakres
- Strona główna z wyborem trybu.
- Tryb solo (quiz, timer, punkty, podsumowanie).
- Tryb multiplayer (lobby, runda, ranking, koniec gry).

## Kroki implementacji
1. Strona główna:
   - `GameShell.tsx`: wybór trybu, wyróżnienie multiplayer.
2. Singleplayer:
   - `Game.tsx`: wyświetlanie hintów, input, punktacja, timer.
   - Podsumowanie z listą haseł i punktów.
3. Multiplayer:
   - `Room.tsx`: lobby, start gry, ranking z lewej, runda z hintami.
   - Widok końcowy: ranking + powrót do lobby (host).
4. Maskowanie:
   - W UI pierwsza podpowiedź w monospace z zachowaniem spacji.
5. Responsywność:
   - Gridy dla desktopu, stack dla mobile.

## Wytyczne UX
- Statusy i komunikaty czytelne (błędy, poprawne odpowiedzi).
- Wysoki kontrast i duże CTA.
- Timer jako pasek postępu.

## Checklist
- [ ] Widok wyboru trybu
- [ ] Widok gry solo
- [ ] Widok lobby multiplayer
- [ ] Widok rundy multiplayer
- [ ] Widok końca gry multiplayer
