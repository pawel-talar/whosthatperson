PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS category (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

INSERT OR IGNORE INTO category (code, label) VALUES
('film', 'Film'),
('testowa', 'Testowa'),
('muzyka', 'Muzyka'),
('nauka', 'Nauka'),
('polska', 'Polska');

UPDATE persons SET category = 'film' WHERE lower(category) = 'film';
UPDATE persons SET category = 'testowa' WHERE lower(category) = 'testowa';

CREATE TABLE IF NOT EXISTS persons_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES category(code),
  occupation TEXT NOT NULL,
  hints TEXT NOT NULL
);

INSERT INTO persons_new (id, name, category, occupation, hints)
SELECT id, name, category, occupation, hints FROM persons;

DROP TABLE persons;
ALTER TABLE persons_new RENAME TO persons;

PRAGMA foreign_keys = ON;
