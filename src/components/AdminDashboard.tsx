import { useEffect, useMemo, useState } from "react";

type Category = {
  code: string;
  label: string;
};

type Person = {
  id: string;
  name: string;
  occupation: string;
  categories: string[];
  hints: string[];
};

type PersonResponse = {
  items: Person[];
  total: number;
  limit: number;
  offset: number;
};

const apiBase = import.meta.env.BASE_URL;

const normalizeCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");

export default function AdminDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [personTotal, setPersonTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [categoryCode, setCategoryCode] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  const [editingCategoryCode, setEditingCategoryCode] = useState<string | null>(
    null
  );
  const [editingCategoryLabel, setEditingCategoryLabel] = useState("");

  const [personName, setPersonName] = useState("");
  const [personOccupation, setPersonOccupation] = useState("");
  const [personHints, setPersonHints] = useState("");
  const [personCategories, setPersonCategories] = useState<string[]>([]);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [personQuery, setPersonQuery] = useState("");
  const [personPage, setPersonPage] = useState(1);

  const pageSize = 20;

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(pageSize));
      params.set("offset", String((personPage - 1) * pageSize));
      if (personQuery.trim()) {
        params.set("q", personQuery.trim());
      }

      const [catRes, personRes] = await Promise.all([
        fetch(`${apiBase}api/admin/categories`),
        fetch(`${apiBase}api/admin/persons?${params.toString()}`)
      ]);
      if (!catRes.ok || !personRes.ok) {
        throw new Error("Nie udało się pobrać danych.");
      }
      const catData = (await catRes.json()) as Category[];
      const personData = (await personRes.json()) as PersonResponse;
      setCategories(catData);
      setPersons(personData.items);
      setPersonTotal(personData.total);

      const totalPages = Math.max(1, Math.ceil(personData.total / pageSize));
      if (personPage > totalPages) {
        setPersonPage(totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [personPage, personQuery]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.code,
        label: category.label
      })),
    [categories]
  );

  const toggleCategory = (code: string) => {
    setPersonCategories((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const startEditCategory = (category: Category) => {
    setEditingCategoryCode(category.code);
    setEditingCategoryLabel(category.label);
  };

  const cancelEditCategory = () => {
    setEditingCategoryCode(null);
    setEditingCategoryLabel("");
  };

  const submitCategoryEdit = async () => {
    if (!editingCategoryCode) return;
    if (!editingCategoryLabel.trim()) {
      setError("Podaj nazwę kategorii.");
      return;
    }
    setMessage("");
    const response = await fetch(
      `${apiBase}api/admin/categories/${editingCategoryCode}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editingCategoryLabel.trim() })
      }
    );
    if (!response.ok) {
      setError("Nie udało się zaktualizować kategorii.");
      return;
    }
    setMessage("Zaktualizowano kategorię.");
    cancelEditCategory();
    refresh();
  };

  const submitCategory = async () => {
    setMessage("");
    const code = normalizeCode(categoryCode);
    if (!code || !categoryLabel.trim()) {
      setError("Podaj kod i nazwę kategorii.");
      return;
    }
    setError("");
    const response = await fetch(`${apiBase}api/admin/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, label: categoryLabel.trim() })
    });
    if (!response.ok) {
      setError("Nie udało się dodać kategorii.");
      return;
    }
    setCategoryCode("");
    setCategoryLabel("");
    setMessage("Dodano kategorię.");
    refresh();
  };

  const deleteCategory = async (code: string) => {
    if (!window.confirm("Usunąć kategorię? Powiązania zostaną skasowane.")) return;
    setMessage("");
    const response = await fetch(`${apiBase}api/admin/categories/${code}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setError("Nie udało się usunąć kategorii.");
      return;
    }
    if (editingCategoryCode === code) {
      cancelEditCategory();
    }
    setMessage("Usunięto kategorię.");
    refresh();
  };

  const startEditPerson = (person: Person) => {
    setEditingPersonId(person.id);
    setPersonName(person.name);
    setPersonOccupation(person.occupation);
    setPersonHints(person.hints.join("\n"));
    setPersonCategories(person.categories);
    setMessage("");
    setError("");
  };

  const cancelEditPerson = () => {
    setEditingPersonId(null);
    setPersonName("");
    setPersonOccupation("");
    setPersonHints("");
    setPersonCategories([]);
  };

  const submitPerson = async () => {
    setMessage("");
    if (!personName.trim() || !personOccupation.trim()) {
      setError("Podaj imię/nazwę oraz zawód.");
      return;
    }
    const hints = personHints
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (hints.length < 3) {
      setError("Podaj co najmniej 3 podpowiedzi (po jednej na linię).");
      return;
    }
    if (personCategories.length === 0) {
      setError("Wybierz przynajmniej jedną kategorię.");
      return;
    }
    setError("");
    const targetUrl = editingPersonId
      ? `${apiBase}api/admin/persons/${editingPersonId}`
      : `${apiBase}api/admin/persons`;
    const response = await fetch(targetUrl, {
      method: editingPersonId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: personName.trim(),
        occupation: personOccupation.trim(),
        hints,
        categories: personCategories
      })
    });
    if (!response.ok) {
      setError(
        editingPersonId
          ? "Nie udało się zaktualizować osoby."
          : "Nie udało się dodać osoby."
      );
      return;
    }
    cancelEditPerson();
    setMessage(editingPersonId ? "Zapisano zmiany." : "Dodano osobę.");
    refresh();
  };

  const deletePerson = async (id: string) => {
    if (!window.confirm("Usunąć osobę?")) return;
    setMessage("");
    const response = await fetch(`${apiBase}api/admin/persons/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      setError("Nie udało się usunąć osoby.");
      return;
    }
    if (editingPersonId === id) {
      cancelEditPerson();
    }
    setMessage("Usunięto osobę.");
    refresh();
  };

  const totalPages = Math.max(1, Math.ceil(personTotal / pageSize));

  return (
    <div className="space-y-8">
      {(error || message) && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
          {error ? <p className="text-rose-200">{error}</p> : <p>{message}</p>}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Kategorie
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={categoryCode}
              onChange={(event) => setCategoryCode(event.target.value)}
              placeholder="Kod (np. film)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            />
            <input
              value={categoryLabel}
              onChange={(event) => setCategoryLabel(event.target.value)}
              placeholder="Nazwa (np. Film)"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <button
            className="mt-3 rounded-xl border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
            onClick={submitCategory}
          >
            Dodaj kategorię
          </button>

          <div className="mt-4 space-y-2 text-slate-200">
            {loading && <p className="text-sm text-slate-400">Ładowanie...</p>}
            {!loading &&
              categories.map((category) => (
                <div
                  key={category.code}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2"
                >
                  {editingCategoryCode === category.code ? (
                    <>
                      <input
                        value={editingCategoryLabel}
                        onChange={(event) =>
                          setEditingCategoryLabel(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 sm:w-auto"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                          onClick={submitCategoryEdit}
                        >
                          Zapisz
                        </button>
                        <button
                          className="text-xs font-semibold text-slate-300 hover:text-white"
                          onClick={cancelEditCategory}
                        >
                          Anuluj
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span>
                        {category.label}{" "}
                        <span className="text-xs text-slate-400">
                          ({category.code})
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs font-semibold text-slate-200 hover:text-white"
                          onClick={() => startEditCategory(category)}
                        >
                          Edytuj
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-200 hover:text-rose-100"
                          onClick={() => deleteCategory(category.code)}
                        >
                          Usuń
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            {editingPersonId ? "Edytuj osobę" : "Dodaj osobę"}
          </p>
          <div className="mt-4 grid gap-3">
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Imię i nazwisko"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            />
            <input
              value={personOccupation}
              onChange={(event) => setPersonOccupation(event.target.value)}
              placeholder="Zawód / opis"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            />
            <textarea
              value={personHints}
              onChange={(event) => setPersonHints(event.target.value)}
              placeholder={"Podpowiedzi (min. 3) — każda w nowej linii"}
              className="min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
            />
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((category) => {
                const active = personCategories.includes(category.value);
                return (
                  <button
                    key={category.value}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-emerald-400 text-slate-900"
                        : "border border-slate-700 text-slate-200 hover:border-slate-500"
                    }`}
                    onClick={() => toggleCategory(category.value)}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="rounded-xl border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
              onClick={submitPerson}
            >
              {editingPersonId ? "Zapisz zmiany" : "Dodaj osobę"}
            </button>
            {editingPersonId && (
              <button
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
                onClick={cancelEditPerson}
              >
                Anuluj
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Osoby</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <input
            value={personQuery}
            onChange={(event) => {
              setPersonQuery(event.target.value);
              setPersonPage(1);
            }}
            placeholder="Szukaj po imieniu lub zawodzie"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 sm:w-auto"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>
              Strona {personPage} z {totalPages}
            </span>
            <button
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPersonPage((prev) => Math.max(1, prev - 1))}
              disabled={personPage <= 1}
            >
              Poprzednia
            </button>
            <button
              className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPersonPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={personPage >= totalPages}
            >
              Następna
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-slate-200">
          {loading && <p className="text-sm text-slate-400">Ładowanie...</p>}
          {!loading &&
            persons.map((person) => (
              <div
                key={person.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-slate-900/60 px-4 py-2 ${
                  editingPersonId === person.id
                    ? "border-emerald-400/60"
                    : "border-slate-800"
                }`}
              >
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-xs text-slate-400">{person.occupation}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {person.categories.map((code) => (
                      <span
                        key={`${person.id}-${code}`}
                        className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs font-semibold text-slate-200 hover:text-white"
                    onClick={() => startEditPerson(person)}
                  >
                    Edytuj
                  </button>
                  <button
                    className="text-xs font-semibold text-rose-200 hover:text-rose-100"
                    onClick={() => deletePerson(person.id)}
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
