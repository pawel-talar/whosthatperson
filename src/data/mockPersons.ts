import type { Person } from "../types/person";

type PersonSeed = Omit<Person, "hints"> & { hints: string[] };

const maskName = (name: string) =>
  name
    .split("")
    .map((char) => (/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(char) ? "_" : char))
    .join("");

const basePersons: PersonSeed[] = [
  {
    id: "einstein",
    name: "Albert Einstein",
    category: "Testowa",
    occupation: "fizyk teoretyczny",
    hints: [
      "Urodził się w Ulm w 1879 roku.",
      "Pracował w urzędzie patentowym w Bernie.",
      "Opisał zjawisko fotoelektryczne.",
      "Sformułował szczególną teorię względności.",
      "Jego nazwisko stało się synonimem geniusza."
    ]
  },
  {
    id: "curie",
    name: "Maria Skłodowska-Curie",
    category: "Testowa",
    occupation: "fizyczka i chemiczka",
    hints: [
      "Pochodziła z Warszawy.",
      "Pracowała naukowo w Paryżu.",
      "Badała zjawiska promieniotwórczości.",
      "Odkryła pierwiastki polon i rad.",
      "Jest jedyną osobą, która otrzymała Nagrodę Nobla w dwóch różnych dziedzinach nauk ścisłych."
    ]
  },
  {
    id: "jobs",
    name: "Steve Jobs",
    category: "Testowa",
    occupation: "przedsiębiorca technologiczny",
    hints: [
      "Urodził się w 1955 roku w Kalifornii.",
      "Był współzałożycielem firmy komputerowej.",
      "Został zwolniony z własnej firmy, do której później wrócił.",
      "Stoi za sukcesem popularnego odtwarzacza muzyki i smartfona.",
      "Był twarzą firmy Apple przez wiele lat."
    ]
  },
  {
    id: "mercury",
    name: "Freddie Mercury",
    category: "Testowa",
    occupation: "wokalista rockowy",
    hints: [
      "Urodził się jako Farrokh Bulsara.",
      "Pochodził z Zanzibaru.",
      "Był znany z charakterystycznego głosu i scenicznej charyzmy.",
      "Był frontmanem brytyjskiego zespołu rockowego.",
      "Śpiewał w utworach takich jak „Bohemian Rhapsody” i „We Are the Champions”."
    ]
  },
  {
    id: "rowling",
    name: "J.K. Rowling",
    category: "Testowa",
    occupation: "pisarka",
    hints: [
      "Pochodzi z Wielkiej Brytanii.",
      "Pomysł na jej najsłynniejszą serię pojawił się w pociągu.",
      "Pierwszą książkę pisała m.in. w kawiarniach.",
      "Stworzyła historię o chłopcu-czarodzieju uczącym się w szkole magii.",
      "Jest autorką serii o Harrym Potterze."
    ]
  },
  {
    id: "de-niro",
    name: "Robert De Niro",
    category: "Testowa",
    occupation: "aktor filmowy",
    hints: [
      "Urodził się w Nowym Jorku.",
      "Często współpracował z reżyserem Martinem Scorsese.",
      "Zagrał m.in. młodszą wersję bohatera granego przez Marlona Brando.",
      "Wystąpił w filmach „Taksówkarz” i „Wściekły byk”.",
      "Znany jest z kwestii „You talkin' to me?”."
    ]
  },
  {
    id: "king",
    name: "Stephen King",
    category: "Testowa",
    occupation: "pisarz grozy",
    hints: [
      "Pochodzi ze Stanów Zjednoczonych.",
      "Często umieszcza akcję swoich książek w stanie Maine.",
      "Jest autorem wielu powieści grozy i thrillerów.",
      "Napisał m.in. „Lśnienie” i „To”.",
      "Nazywany jest „królem horroru”."
    ]
  },
  {
    id: "hawking",
    name: "Stephen Hawking",
    category: "Testowa",
    occupation: "fizyk teoretyczny i kosmolog",
    hints: [
      "Studiował w Oksfordzie i Cambridge.",
      "Zdiagnozowano u niego stwardnienie zanikowe boczne.",
      "Badał naturę czarnych dziur.",
      "Napisał popularnonaukową książkę o historii czasu.",
      "Stał się ikoną popularyzacji nauki mimo ciężkiej choroby."
    ]
  },
  {
    id: "madonna",
    name: "Madonna",
    category: "Testowa",
    occupation: "piosenkarka pop",
    hints: [
      "Urodziła się w stanie Michigan.",
      "Nazywana jest „Królową Popu”.",
      "Znana jest z ciągłego zmieniania wizerunku i stylu.",
      "Jej utwory to m.in. „Like a Virgin” i „Vogue”.",
      "Ma duży wpływ na kulturę popularną od lat 80."
    ]
  },
  {
    id: "tarantino",
    name: "Quentin Tarantino",
    category: "Testowa",
    occupation: "reżyser filmowy",
    hints: [
      "Pracował kiedyś w wypożyczalni kaset wideo.",
      "Jego filmy często mają nielinearną narrację.",
      "Jest znany z charakterystycznych dialogów i dużej ilości przemocy na ekranie.",
      "Wyreżyserował „Pulp Fiction”.",
      "Stoi za filmami takimi jak „Kill Bill” i „Django”."
    ]
  }
];

export const mockPersons: Person[] = basePersons.map((person) => ({
  ...person,
  hints: [maskName(person.name), ...person.hints]
}));
