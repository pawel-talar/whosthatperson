import { useState } from "react";
import Game from "./Game";

type Mode = "solo" | "multiplayer" | null;

const apiBase = import.meta.env.BASE_URL;

export default function GameShell() {
  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (mode === "solo") {
    return <Game />;
  }

  if (mode === "multiplayer") {
    const createRoom = async () => {
      if (!name.trim()) {
        setError("Podaj nick, aby utworzyć pokój.");
        return;
      }
      setError("");
      setIsCreating(true);

      try {
        const response = await fetch(`${apiBase}api/room`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        if (!response.ok) {
          throw new Error("Nie udało się utworzyć pokoju.");
        }
        const data = (await response.json()) as {
          roomId: string;
          hostKey: string;
        };
        window.sessionStorage.setItem(`room:${data.roomId}:hostKey`, data.hostKey);
        window.sessionStorage.setItem(`room:${data.roomId}:name`, name.trim());
        window.location.href = `/room/${data.roomId}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd.");
      } finally {
        setIsCreating(false);
      }
    };

    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="text-2xl font-semibold text-slate-100">
            Gra ze znajomymi
          </h2>
          <p className="mt-2 text-slate-300">
            Wpisz nick i utwórz pokój, aby zaprosić znajomych.
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
            className="rounded-xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={createRoom}
            disabled={isCreating}
          >
            {isCreating ? "Tworzę..." : "Utwórz pokój"}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={() => setMode(null)}
          >
            Wróć
          </button>
        </div>

        {error && <p className="text-sm text-rose-200">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-2xl font-semibold text-slate-100">Wybierz tryb gry</h2>
        <p className="mt-2 text-slate-300">
          Zagraj solo w quiz z podpowiedziami lub zagraj ze znajomymi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          className="rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-6 py-5 text-left text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/20"
          onClick={() => setMode("solo")}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Tryb</p>
          <p className="mt-2 text-xl font-semibold">Graj sam</p>
          <p className="mt-2 text-sm text-emerald-200/80">
            Klasyczny quiz z punktami i timerem.
          </p>
        </button>

        <button
          className="relative rounded-2xl border border-amber-400/70 bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-slate-900/40 px-6 py-5 text-left text-amber-100 shadow-lg shadow-amber-500/10 transition hover:border-amber-300 hover:shadow-amber-500/20"
          onClick={() => setMode("multiplayer")}
        >
          <span className="absolute right-4 top-4 rounded-full border border-amber-300/60 bg-amber-500/20 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
            Nowość
          </span>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Tryb</p>
          <p className="mt-2 text-xl font-semibold">Graj ze znajomymi</p>
          <p className="mt-2 text-sm text-amber-100/80">
            Twórz pokoje i rywalizuj na żywo.
          </p>
        </button>
      </div>
    </div>
  );
}
