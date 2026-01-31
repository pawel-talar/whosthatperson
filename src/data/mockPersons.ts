import type { Person } from "../types/person";

type PersonSeed = Omit<Person, "hints"> & { hints: string[] };

const maskName = (name: string) => {
  const tokens: string[] = [];
  for (const char of name) {
    if (/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(char)) {
      tokens.push("_");
      continue;
    }
    if (char === " ") {
      tokens.push(" ");
      continue;
    }
    tokens.push(char);
  }
  return tokens.join(" ");
};

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
  },
  {
    id: "newton",
    name: "Isaac Newton",
    category: "Testowa",
    occupation: "fizyk i matematyk",
    hints: [
      "Urodził się w Anglii w 1643 roku.",
      "Studiował na Uniwersytecie w Cambridge.",
      "Opisał prawa ruchu klasycznego.",
      "Sformułował prawo powszechnego ciążenia.",
      "Jest autorem dzieła „Principia Mathematica”."
    ]
  },
  {
    id: "tesla",
    name: "Nikola Tesla",
    category: "Testowa",
    occupation: "wynalazca i inżynier",
    hints: [
      "Urodził się w Smiljanie w 1856 roku.",
      "Słynął z pracy nad prądem przemiennym.",
      "Stworzył cewkę wysokiego napięcia znaną do dziś.",
      "Pracował w USA i współpracował z Edisonem.",
      "Jego nazwisko nosi jednostka indukcji magnetycznej."
    ]
  },
  {
    id: "darwin",
    name: "Charles Darwin",
    category: "Testowa",
    occupation: "przyrodnik",
    hints: [
      "Był angielskim badaczem XIX wieku.",
      "Wyruszył w podróż statkiem HMS Beagle.",
      "Badał przyrodę m.in. na Galapagos.",
      "Stworzył teorię ewolucji przez dobór naturalny.",
      "Napisał „O powstawaniu gatunków”."
    ]
  },
  {
    id: "galilei",
    name: "Galileo Galilei",
    category: "Testowa",
    occupation: "astronom i fizyk",
    hints: [
      "Urodził się w Pizie w 1564 roku.",
      "Udoskonalił teleskop i obserwował niebo.",
      "Odkrył fazy Wenus i księżyce Jowisza.",
      "Popierał teorię heliocentryczną.",
      "Został skazany przez inkwizycję."
    ]
  },
  {
    id: "chopin",
    name: "Fryderyk Chopin",
    category: "Testowa",
    occupation: "kompozytor i pianista",
    hints: [
      "Urodził się w Żelazowej Woli.",
      "Większość życia spędził we Francji.",
      "Komponował głównie na fortepian.",
      "Tworzył mazurki i polonezy.",
      "Jest jednym z najsłynniejszych polskich kompozytorów."
    ]
  },
  {
    id: "beethoven",
    name: "Ludwig van Beethoven",
    category: "Testowa",
    occupation: "kompozytor",
    hints: [
      "Urodził się w Bonn w 1770 roku.",
      "Tworzył w okresie klasycyzmu i romantyzmu.",
      "Mimo postępującej głuchoty komponował dalej.",
      "Jego IX Symfonia zawiera „Odę do radości”.",
      "Jest jednym z najwybitniejszych kompozytorów w historii."
    ]
  },
  {
    id: "vangogh",
    name: "Vincent van Gogh",
    category: "Testowa",
    occupation: "malarz",
    hints: [
      "Był holenderskim artystą.",
      "Malował w stylu postimpresjonistycznym.",
      "Stworzył obraz „Gwiaździsta noc”.",
      "Mieszkał m.in. w Arles.",
      "Słynny jest epizod z odciętym uchem."
    ]
  },
  {
    id: "picasso",
    name: "Pablo Picasso",
    category: "Testowa",
    occupation: "malarz i rzeźbiarz",
    hints: [
      "Urodził się w Hiszpanii.",
      "Był współtwórcą kubizmu.",
      "Jego obraz „Guernica” potępia wojnę.",
      "Miał okres błękitny i różowy.",
      "Jest jednym z najbardziej rozpoznawalnych artystów XX wieku."
    ]
  },
  {
    id: "da-vinci",
    name: "Leonardo da Vinci",
    category: "Testowa",
    occupation: "malarz i wynalazca",
    hints: [
      "Był wszechstronnym geniuszem renesansu.",
      "Stworzył szkice maszyn i wynalazków.",
      "Namierzał anatomię człowieka w swoich notatkach.",
      "Jest autorem „Mony Lisy”.",
      "Namalował także „Ostatnią Wieczerzę”."
    ]
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    category: "Testowa",
    occupation: "dramaturg i poeta",
    hints: [
      "Urodził się w Stratford-upon-Avon.",
      "Tworzył w epoce elżbietańskiej.",
      "Jego sztuki wystawiano w teatrze The Globe.",
      "Napisał „Hamleta” i „Romea i Julię”.",
      "Był nazywany „bardem z Avon”."
    ]
  },
  {
    id: "mandela",
    name: "Nelson Mandela",
    category: "Testowa",
    occupation: "polityk i działacz społeczny",
    hints: [
      "Pochodził z Republiki Południowej Afryki.",
      "Walczył z apartheidem.",
      "Spędził 27 lat w więzieniu.",
      "Po uwolnieniu został prezydentem kraju.",
      "Otrzymał Pokojową Nagrodę Nobla."
    ]
  },
  {
    id: "churchill",
    name: "Winston Churchill",
    category: "Testowa",
    occupation: "polityk",
    hints: [
      "Był premierem Wielkiej Brytanii podczas II wojny światowej.",
      "Znany z charakterystycznych przemówień.",
      "Otrzymał literacką Nagrodę Nobla.",
      "Był także historykiem i pisarzem.",
      "Słynął z cygara i meloników."
    ]
  },
  {
    id: "earhart",
    name: "Amelia Earhart",
    category: "Testowa",
    occupation: "pilotka",
    hints: [
      "Była amerykańską pionierką lotnictwa.",
      "Jako pierwsza kobieta przeleciała samotnie Atlantyk.",
      "Wyruszyła w próbę lotu dookoła świata.",
      "Zaginęła nad Pacyfikiem w 1937 roku.",
      "Stała się ikoną odwagi i niezależności."
    ]
  },
  {
    id: "kahlo",
    name: "Frida Kahlo",
    category: "Testowa",
    occupation: "malarka",
    hints: [
      "Pochodziła z Meksyku.",
      "Tworzyła głównie autoportrety.",
      "Przeżyła poważny wypadek w młodości.",
      "Była związana z Diego Riverą.",
      "Jej prace łączą symbolikę i motywy ludowe."
    ]
  },
  {
    id: "chaplin",
    name: "Charlie Chaplin",
    category: "Testowa",
    occupation: "aktor i reżyser",
    hints: [
      "Był gwiazdą kina niemego.",
      "Stworzył postać Charliego włóczęgi.",
      "Urodził się w Londynie.",
      "Wyreżyserował film „Dyktator”.",
      "Znany z charakterystycznego wąsa i meloników."
    ]
  },
  {
    id: "jordan",
    name: "Michael Jordan",
    category: "Testowa",
    occupation: "koszykarz",
    hints: [
      "Grał w NBA w latach 80. i 90.",
      "Związany z klubem Chicago Bulls.",
      "Zdobył sześć tytułów mistrzowskich NBA.",
      "Znany z numeru 23.",
      "Współtworzył markę Air Jordan."
    ]
  },
  {
    id: "serena",
    name: "Serena Williams",
    category: "Testowa",
    occupation: "tenisistka",
    hints: [
      "Pochodzi ze Stanów Zjednoczonych.",
      "Wspólnie z siostrą Venus zdominowała tenis.",
      "Zdobyła wiele tytułów wielkoszlemowych.",
      "Słynie z potężnego serwisu.",
      "Jest uznawana za jedną z najlepszych w historii tenisa."
    ]
  },
  {
    id: "anne-frank",
    name: "Anne Frank",
    category: "Testowa",
    occupation: "autorka dziennika",
    hints: [
      "Była nastolatką żydowskiego pochodzenia.",
      "Ukrywała się w Amsterdamie podczas II wojny światowej.",
      "Prowadziła dziennik w kryjówce.",
      "Jej zapiski stały się światowym symbolem wojny.",
      "Dziennik opublikowano po wojnie."
    ]
  },
  {
    id: "lovelace",
    name: "Ada Lovelace",
    category: "Testowa",
    occupation: "matematyczka",
    hints: [
      "Żyła w XIX wieku w Wielkiej Brytanii.",
      "Współpracowała z Charlesem Babbage'em.",
      "Opisała algorytm dla maszyny analitycznej.",
      "Uznawana za pierwszą programistkę.",
      "Jej imię nosi język programowania."
    ]
  },
  {
    id: "turing",
    name: "Alan Turing",
    category: "Testowa",
    occupation: "matematyk i kryptolog",
    hints: [
      "Był brytyjskim uczonym XX wieku.",
      "Pracował nad złamaniem szyfru Enigmy.",
      "Twórca koncepcji maszyny Turinga.",
      "Zajmował się podstawami sztucznej inteligencji.",
      "Uważany za jednego z ojców informatyki."
    ]
  }
];

export const mockPersons: Person[] = basePersons.map((person) => ({
  ...person,
  hints: [maskName(person.name), ...person.hints]
}));
