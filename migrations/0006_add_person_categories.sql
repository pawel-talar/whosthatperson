PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS person_category (
  person_id TEXT NOT NULL,
  category_code TEXT NOT NULL,
  PRIMARY KEY (person_id, category_code),
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (category_code) REFERENCES category(code) ON DELETE CASCADE
);

INSERT OR IGNORE INTO person_category (person_id, category_code)
SELECT id, category FROM persons;

PRAGMA foreign_keys = ON;
