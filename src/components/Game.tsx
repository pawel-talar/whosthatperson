import { useEffect, useMemo, useState } from "react";
import type { Person } from "../types/person";

type GameStatus = "idle" | "playing" | "finished";

type RoundResult = {
  person: Person;
  hintsUsed: number;
  score: number;
  lostPoints: number;
  correct: boolean;
};

const BASE_SCORE = 100;
const HINT_PENALTY = 20;
const TOTAL_QUESTIONS = 5;
const SECONDS_PER_QUESTION = 10;

export default function Game() {
  const [quizPersons, setQuizPersons] = useState<Person[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [visibleHintCount, setVisibleHintCount] = useState(1);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);

  const startGame = async () => {
    setIsLoading(true);
    setMessage("");
    setResults([]);
    setCurrentIndex(0);
    setQuizPersons([]);
    setSecondsLeft(TOTAL_QUESTIONS * SECONDS_PER_QUESTION);
    setTimeUp(false);

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/persons`);
      if (!response.ok) {
        throw new Error("Nie udało się pobrać osoby.");
      }
      const persons: Person[] = await response.json();
      const testCategory = persons.filter((person) => person.category === "Testowa");
      if (testCategory.length < TOTAL_QUESTIONS) {
        throw new Error("Za mało pytań w kategorii Testowa.");
      }

      const shuffled = [...testCategory];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const selected = shuffled.slice(0, TOTAL_QUESTIONS);
      setQuizPersons(selected);
      setCurrentPerson(selected[0]);
      setVisibleHintCount(1);
      setAnswer("");
      setStatus("playing");
      setScore(BASE_SCORE);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wystąpił błąd.");
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeTimeout = () => {
    if (status !== "playing") return;

    const remainingResults: RoundResult[] = [];
    if (currentPerson) {
      remainingResults.push({
        person: currentPerson,
        hintsUsed: visibleHintCount,
        score: 0,
        lostPoints: BASE_SCORE,
        correct: false
      });
    }

    const nextStart = currentPerson ? currentIndex + 1 : currentIndex;
    quizPersons.slice(nextStart, TOTAL_QUESTIONS).forEach((person) => {
      remainingResults.push({
        person,
        hintsUsed: 1,
        score: 0,
        lostPoints: BASE_SCORE,
        correct: false
      });
    });

    setResults((prev) => [...prev, ...remainingResults]);
    setTimeUp(true);
    setStatus("finished");
    setCurrentPerson(null);
    setMessage("Czas minął! Quiz zakończony.");
  };

  useEffect(() => {
    if (status !== "playing") return;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          finalizeTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    status,
    currentPerson,
    currentIndex,
    quizPersons,
    results,
    visibleHintCount
  ]);

  const resetToHome = () => {
    setCurrentPerson(null);
    setQuizPersons([]);
    setCurrentIndex(0);
    setVisibleHintCount(1);
    setAnswer("");
    setStatus("idle");
    setScore(0);
    setMessage("");
    setSecondsLeft(0);
    setTimeUp(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showNextHint = () => {
    if (!currentPerson) return;
    setVisibleHintCount((prev) => {
      const next = Math.min(prev + 1, currentPerson.hints.length);
      if (next !== prev) {
        setScore((scorePrev) => Math.max(0, scorePrev - HINT_PENALTY));
      }
      return next;
    });
  };

  const checkAnswer = () => {
    if (!currentPerson) return;
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedName = currentPerson.name.toLowerCase();

    if (!normalizedAnswer) {
      setMessage("Wpisz odpowiedź przed zgadywaniem.");
      return;
    }

    if (normalizedAnswer === normalizedName) {
      const hintsUsed = visibleHintCount;
      const lostPoints = Math.max(0, BASE_SCORE - score);
      const nextResults = [
        ...results,
        { person: currentPerson, hintsUsed, score, lostPoints, correct: true }
      ];
      setResults(nextResults);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= TOTAL_QUESTIONS) {
        setStatus("finished");
        setCurrentPerson(null);
        setMessage("Quiz zakończony! Zobacz podsumowanie.");
        return;
      }

      const nextPerson = quizPersons[nextIndex];
      setCurrentIndex(nextIndex);
      setCurrentPerson(nextPerson);
      setVisibleHintCount(1);
      setAnswer("");
      setScore(BASE_SCORE);
      setMessage("Poprawna odpowiedź! Następne pytanie.");
    } else {
      setAnswer("");
      setMessage(
        "Niepoprawna odpowiedź, spróbuj ponownie lub poproś o kolejną podpowiedź."
      );
      setIsShaking(true);
      window.setTimeout(() => setIsShaking(false), 320);
    }
  };

  const skipQuestion = () => {
    if (!currentPerson) return;
    const hintsUsed = visibleHintCount;
    const lostPoints = BASE_SCORE;
    const nextResults = [
      ...results,
      { person: currentPerson, hintsUsed, score: 0, lostPoints, correct: false }
    ];
    setResults(nextResults);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      setStatus("finished");
      setCurrentPerson(null);
      setMessage("Quiz zakończony! Zobacz podsumowanie.");
      return;
    }

    const nextPerson = quizPersons[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentPerson(nextPerson);
    setVisibleHintCount(1);
    setAnswer("");
    setScore(BASE_SCORE);
    setMessage("Pominięto pytanie. Następne pytanie.");
  };

  const canShowMoreHints =
    status === "playing" &&
    currentPerson &&
    visibleHintCount < currentPerson.hints.length;

  const visibleHints = currentPerson
    ? currentPerson.hints.slice(0, visibleHintCount)
    : [];

  const totalEarned = useMemo(
    () => results.reduce((sum, result) => sum + result.score, 0),
    [results]
  );
  const totalLost = useMemo(
    () => results.reduce((sum, result) => sum + result.lostPoints, 0),
    [results]
  );
  const hasCorrect = useMemo(
    () => results.some((result) => result.correct),
    [results]
  );
  const timeBonus = status === "finished" && hasCorrect ? secondsLeft * 2 : 0;
  const totalWithBonus = totalEarned + timeBonus;

  const totalTime = TOTAL_QUESTIONS * SECONDS_PER_QUESTION;
  const timeProgress = totalTime > 0 ? (secondsLeft / totalTime) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kategoria</p>
          <p className="text-lg font-semibold">Testowa</p>
        </div>
        <div className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          Punkty: <span className="font-semibold">{status === "playing" ? score : 0}</span>
        </div>
      </div>

      {status === "idle" && (
        <button
          className="w-full rounded-xl bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-emerald-300"
          onClick={startGame}
          disabled={isLoading}
        >
          {isLoading ? "Ładowanie..." : "Rozpocznij grę"}
        </button>
      )}

      {status === "finished" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Podsumowanie quizu
            </p>
            <p className="text-lg font-medium text-slate-100">
              Ukończono {results.length}/{TOTAL_QUESTIONS} pytań
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1">
                Suma punktów:{" "}
                <strong className="text-emerald-200">{totalWithBonus}</strong>
              </span>
              <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sky-200">
                Bonus za czas: {timeBonus}
              </span>
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
                Punkty stracone:{" "}
                <strong className="text-amber-200">{totalLost}</strong>
              </span>
              {timeUp && (
                <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 text-rose-200">
                  Czas minął
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Hasła i utracone punkty
            </p>
            <ol className="space-y-2 text-slate-200">
              {results.map((result, index) => (
                <li
                  key={`${result.person.id}-summary`}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {index + 1}. {result.person.name}
                    </span>
                    <span className="text-sm text-amber-200">
                      Punkty stracone: {result.lostPoints}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <button
            className="rounded-xl bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            onClick={startGame}
          >
            Zagraj ponownie
          </button>
          <button
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            onClick={resetToHome}
          >
            Wróć do strony głównej
          </button>
        </div>
      )}

      {currentPerson && status === "playing" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Zawód</p>
            <p className="text-lg font-medium text-slate-100">
              {currentPerson.occupation}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Pytanie {currentIndex + 1}/{TOTAL_QUESTIONS}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Tempo quizu</span>
                <span>Pozostało: {secondsLeft}s</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
            </div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Podpowiedzi ({visibleHintCount}/{currentPerson.hints.length})
            </p>
            <ol className="space-y-2 text-slate-200">
              {visibleHints.map((hint, index) => (
                <li
                  key={`${currentPerson.id}-${index}`}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3"
                >
                  {index === 0 && (
                    <span className="mb-2 inline-flex rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-slate-400">
                      Wzór odpowiedzi
                    </span>
                  )}
                  <p>{hint}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className={`grid gap-3 sm:grid-cols-[1fr_auto] ${isShaking ? "shake" : ""}`}>
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && status === "playing") {
                  event.preventDefault();
                  checkAnswer();
                }
              }}
              placeholder="Twoja odpowiedź..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <button
              className="rounded-xl border border-emerald-400/60 px-6 py-3 text-base font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={checkAnswer}
              disabled={status !== "playing"}
            >
              Zgadnij
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={showNextHint}
              disabled={!canShowMoreHints}
            >
              Pokaż kolejną podpowiedź
            </button>
            <button
              className="rounded-xl border border-amber-400/60 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-amber-100"
              onClick={skipQuestion}
            >
              Pomiń pytanie
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
          <p>{message}</p>
          {status === "playing" && (
            <p className="mt-2 text-emerald-300">
              Aktualne punkty za to pytanie: {score}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
