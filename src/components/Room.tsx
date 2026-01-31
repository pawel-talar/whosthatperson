import { useEffect, useMemo, useRef, useState } from "react";

type Player = {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  connected: boolean;
};

type Guess = {
  playerId: string;
  playerName: string;
  answer: string;
  correct: boolean;
  timeMs: number;
  points: number;
};

type RoomState = {
  id: string;
  hostId: string | null;
  players: Player[];
  roundStatus: "lobby" | "playing" | "roundEnd";
  gameOver: boolean;
  currentRound: number;
  totalRounds: number;
  roundHistory: { id: string; name: string }[];
  visibleHints: number;
  hints: string[];
  occupation: string | null;
  guesses: Guess[];
  roundStartTime: number | null;
  roundDurationSec: number;
  revealedName: string | null;
  hintIntervalSec: number;
  nextHintAt: number | null;
};

type Props = {
  roomId: string;
};

const apiBase = import.meta.env.BASE_URL;

export default function Room({ roomId }: Props) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [now, setNow] = useState(Date.now());
  const [configHintInterval, setConfigHintInterval] = useState(5);
  const [configRoundDuration, setConfigRoundDuration] = useState(30);
  const [hostTab, setHostTab] = useState<"game" | "settings">("game");

  useEffect(() => {
    const storedName = window.sessionStorage.getItem(`room:${roomId}:name`);
    const storedPlayerId = window.sessionStorage.getItem(`room:${roomId}:playerId`);
    if (storedName) setName(storedName);
    if (storedPlayerId) setPlayerId(storedPlayerId);
  }, [roomId]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}${apiBase}api/room/${roomId}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      const storedName = window.sessionStorage.getItem(`room:${roomId}:name`);
      const storedPlayerId = window.sessionStorage.getItem(`room:${roomId}:playerId`);
      const hostKey = window.sessionStorage.getItem(`room:${roomId}:hostKey`);
      if (storedName) {
        socket.send(
          JSON.stringify({
            type: "joinRoom",
            payload: { name: storedName, hostKey, playerId: storedPlayerId }
          })
        );
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "roomUpdate") {
          setRoom(message.payload as RoomState);
        }
        if (message.type === "joined") {
          const payload = message.payload as { playerId: string };
          setPlayerId(payload.playerId);
          window.sessionStorage.setItem(
            `room:${roomId}:playerId`,
            payload.playerId
          );
        }
      } catch {
        // ignore
      }
    };

    socket.onerror = () => {
      setError("Połączenie z serwerem zostało przerwane.");
    };

    socket.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      socket.close();
    };
  }, [roomId]);

  const isHost = room?.hostId === playerId;
  const canStart = room?.players.every((player) => player.ready) ?? false;

  const send = (type: string, payload?: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type, payload }));
  };

  const joinRoom = () => {
    if (!name.trim()) {
      setError("Podaj nick, aby dołączyć.");
      return;
    }
    setError("");
    setIsJoining(true);

    const hostKey = window.sessionStorage.getItem(`room:${roomId}:hostKey`);
    window.sessionStorage.setItem(`room:${roomId}:name`, name.trim());
    send("joinRoom", {
      name: name.trim(),
      hostKey,
      playerId
    });
    setIsJoining(false);
  };

  const toggleReady = () => {
    if (!room || !playerId) return;
    const player = room.players.find((p) => p.id === playerId);
    send("toggleReady", { ready: !player?.ready });
  };

  const startGame = () => {
    send("startGame");
  };

  const nextRound = () => {
    send("nextRound");
  };

  const sendGuess = (answer: string) => {
    send("guess", { answer });
  };

  const applyConfig = () => {
    send("setConfig", {
      hintIntervalSec: configHintInterval,
      roundDurationSec: configRoundDuration
    });
  };

  useEffect(() => {
    const handleUnload = () => {
      send("leave");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  useEffect(() => {
    if (!room) return;
    setConfigHintInterval(room.hintIntervalSec);
    setConfigRoundDuration(room.roundDurationSec);
  }, [room?.hintIntervalSec, room?.roundDurationSec]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  const ranking = useMemo(() => {
    if (!room) return [];
    return [...room.players].sort((a, b) => b.score - a.score);
  }, [room]);

  const [answer, setAnswer] = useState("");
  const nextHintInSec = room?.nextHintAt
    ? Math.max(0, Math.ceil((room.nextHintAt - now) / 1000))
    : null;
  const roundEndsInSec =
    room?.roundStartTime && room?.roundDurationSec
      ? Math.max(
          0,
          Math.ceil((room.roundStartTime + room.roundDurationSec * 1000 - now) / 1000)
        )
      : null;
  const roundProgress =
    room?.roundStartTime && room?.roundDurationSec
      ? Math.min(
          100,
          Math.max(
            0,
            ((now - room.roundStartTime) / (room.roundDurationSec * 1000)) * 100
          )
        )
      : null;

  if (!playerId) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-xl font-semibold text-slate-100">Dołącz do lobby</h2>
          <p className="mt-2 text-slate-300">
            Wpisz nick, aby dołączyć do pokoju.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Twój nick"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
          />
          <button
            className="rounded-xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300"
            onClick={joinRoom}
            disabled={isJoining}
          >
            {isJoining ? "Łączę..." : "Dołącz"}
          </button>
        </div>
        {error && <p className="text-sm text-rose-200">{error}</p>}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-slate-200">
        Ładowanie pokoju...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {room.gameOver ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Ranking</p>
            <ol className="mt-3 space-y-2 text-slate-200">
              {ranking.map((player, index) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                >
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <span className="text-emerald-200">{player.score} pkt</span>
                </li>
                ))}
            </ol>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Hasła z rund
            </p>
            {room.roundHistory.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Brak rozegranych rund.</p>
            ) : (
              <ol className="mt-3 space-y-2 text-slate-200">
                {room.roundHistory.map((entry, index) => (
                  <li
                    key={`${entry.id}-${index}`}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                  >
                    {index + 1}. {entry.name}
                  </li>
                ))}
              </ol>
            )}
          </div>
          {isHost ? (
            <button
              className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              onClick={() => send("resetLobby")}
            >
              Wróć do lobby
            </button>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-300" />
              <span>Czekaj na akcję właściciela lobby.</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {isHost && (
            <div className="flex gap-3">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  hostTab === "game"
                    ? "bg-emerald-400 text-slate-900"
                    : "border border-slate-700 text-slate-200 hover:border-slate-500"
                }`}
                onClick={() => setHostTab("game")}
              >
                Gra
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  hostTab === "settings"
                    ? "bg-emerald-400 text-slate-900"
                    : "border border-slate-700 text-slate-200 hover:border-slate-500"
                }`}
                onClick={() => setHostTab("settings")}
              >
                Ustawienia hosta
              </button>
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-xl font-semibold text-slate-100">Pokój #{room.id}</h2>
            <p className="mt-2 text-slate-300">Udostępnij link znajomym.</p>
            {room.currentRound > 0 && (
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">
                Runda {room.currentRound} / {room.totalRounds}
              </p>
            )}
            <input
              readOnly
              value={`${window.location.origin}/room/${room.id}`}
              className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200"
            />
          </div>

          {room.roundStatus === "lobby" && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Gracze</p>
              <ul className="mt-3 space-y-2 text-slate-200">
                {room.players.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                  >
                    <span>
                      {player.name}
                      {player.id === room.hostId && (
                        <span className="ml-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
                          Host
                        </span>
                      )}
                    </span>
                    <span
                      className={player.ready ? "text-emerald-300" : "text-slate-400"}
                    >
                      {player.ready ? "Gotowy" : "Niegotowy"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isHost && hostTab === "settings" && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                Ustawienia hosta
              </p>
              {room.roundStatus !== "lobby" && (
                <p className="mt-2 text-sm text-slate-400">
                  Ustawienia można zmieniać tylko przed startem gry.
                </p>
              )}
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-slate-200">
                  Auto‑hint co (s)
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={configHintInterval}
                    onChange={(event) =>
                      setConfigHintInterval(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-base text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={room.roundStatus !== "lobby"}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Czas rundy (s)
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={configRoundDuration}
                    onChange={(event) =>
                      setConfigRoundDuration(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-base text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={room.roundStatus !== "lobby"}
                  />
                </label>
              </div>
              <button
                className="mt-3 rounded-xl border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={applyConfig}
                disabled={room.roundStatus !== "lobby"}
              >
                Zapisz ustawienia
              </button>
            </div>
          )}

          {(!isHost || hostTab === "game") && room.roundStatus === "lobby" && (
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-xl border border-emerald-400/60 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
                onClick={toggleReady}
              >
                {room.players.find((p) => p.id === playerId)?.ready
                  ? "Cofnij gotowość"
                  : "Jestem gotowy"}
              </button>
              {isHost && (
                <button
                  className="rounded-xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
                  onClick={startGame}
                  disabled={!canStart}
                >
                  Start gry
                </button>
              )}
            </div>
          )}

          {room.roundStatus !== "lobby" && (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Ranking
                </p>
                <ol className="mt-3 space-y-2 text-slate-200">
                  {ranking.map((player, index) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                    >
                      <span>
                        {index + 1}. {player.name}
                      </span>
                      <span className="text-emerald-200">{player.score} pkt</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-6">
                {(!isHost || hostTab === "game") && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                        Zawód
                      </p>
                      {room.currentRound > 0 && (
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          Runda {room.currentRound} / {room.totalRounds}
                        </p>
                      )}
                      <p className="text-lg font-medium text-slate-100">
                        {room.occupation ?? "-"}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                          Podpowiedzi
                        </p>
                        {roundEndsInSec !== null && room.roundStatus === "playing" && (
                          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                            Koniec rundy za {roundEndsInSec}s
                          </span>
                        )}
                      </div>
                      {roundProgress !== null && room.roundStatus === "playing" && (
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                            style={{ width: `${roundProgress}%` }}
                          />
                        </div>
                      )}
                      <ol className="mt-2 space-y-2 text-slate-200">
                        {room.hints.map((hint, idx) => (
                          <li
                            key={idx}
                            className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                          >
                            <span
                              className={
                                idx === 0
                                  ? "whitespace-pre-wrap font-mono tracking-widest text-slate-100"
                                  : ""
                              }
                            >
                              {hint}
                            </span>
                          </li>
                        ))}
                      </ol>
                      {nextHintInSec !== null && room.roundStatus === "playing" && (
                        <p className="mt-2 text-sm text-slate-400">
                          Następna podpowiedź za {nextHintInSec}s
                        </p>
                      )}
                    </div>

                    {room.roundStatus === "playing" && (
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          value={answer}
                          onChange={(event) => setAnswer(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              sendGuess(answer);
                              setAnswer("");
                            }
                          }}
                          placeholder="Twoja odpowiedź..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                        />
                        <button
                          className="rounded-xl border border-emerald-400/60 px-6 py-3 text-base font-semibold text-emerald-200 transition hover:border-emerald-300"
                          onClick={() => {
                            sendGuess(answer);
                            setAnswer("");
                          }}
                        >
                          Zgadnij
                        </button>
                      </div>
                    )}

                    {room.roundStatus === "roundEnd" && (
                      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="text-emerald-200">
                          To była osoba: <strong>{room.revealedName ?? "-"}</strong>
                        </p>
                        {isHost && (
                          <button
                            className="mt-3 rounded-xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
                            onClick={nextRound}
                          >
                            Następna runda
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Próby
                  </p>
                  <ul className="mt-3 space-y-2 text-slate-200">
                    {room.guesses.map((guess, idx) => {
                      const isMine = guess.playerId === playerId;
                      if (!isMine && !guess.correct) {
                        return null;
                      }

                      return (
                        <li
                          key={idx}
                          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                        >
                          <span>
                            {isMine
                              ? `${guess.playerName}: ${guess.answer}`
                              : "Ktoś odgadł ✅"}
                          </span>
                          {isMine && (
                            <span
                              className={
                                guess.correct ? "text-emerald-200" : "text-rose-200"
                              }
                            >
                              {guess.correct ? `+${guess.points}` : "Błąd"}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
