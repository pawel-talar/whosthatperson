import { useState } from "react";
import Game from "./Game";

type Mode = "solo" | null;

export default function GameShell() {
  const [mode, setMode] = useState<Mode>(null);

  if (mode === "solo") {
    return <Game />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-2xl font-semibold text-slate-100">Wybierz tryb gry</h2>
        <p className="mt-2 text-slate-300">
          Zagraj solo w quiz z podpowiedziami lub wybierz tryb ze znajomymi (wkrótce).
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
          className="rounded-2xl border border-slate-700 bg-slate-900/40 px-6 py-5 text-left text-slate-300 opacity-60"
          disabled
        >
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Tryb</p>
          <p className="mt-2 text-xl font-semibold">Graj ze znajomymi</p>
          <p className="mt-2 text-sm text-slate-400">
            Już wkrótce — przygotowujemy multiplayer.
          </p>
        </button>
      </div>
    </div>
  );
}
