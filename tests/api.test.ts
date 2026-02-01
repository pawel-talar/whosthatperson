import { describe, expect, it } from "vitest";
import { GET as getCategories } from "../src/pages/api/categories";
import { GET as getRandomPerson } from "../src/pages/api/random-person";

type MockResult<T> = { results: T[] };

class MockStatement<T> {
  constructor(private readonly results: T[] = [], private readonly firstValue?: T) {}

  bind() {
    return this;
  }

  async all() {
    return { results: this.results } as MockResult<T>;
  }

  async first() {
    return this.firstValue ?? null;
  }
}

class MockDb {
  constructor(
    private readonly handlers: Record<string, () => MockStatement<unknown>>
  ) {}

  prepare(sql: string) {
    const handler = Object.entries(this.handlers).find(([key]) =>
      sql.includes(key)
    );
    if (!handler) {
      throw new Error(`Unhandled SQL: ${sql}`);
    }
    return handler[1]() as unknown as MockStatement<unknown>;
  }
}

const createContext = (url: string, db: MockDb) => ({
  request: new Request(url),
  locals: { runtime: { env: { DB: db } } }
});

describe("API", () => {
  it("GET /api/categories returns list", async () => {
    const db = new MockDb({
      "FROM category": () =>
        new MockStatement([
          { code: "film", label: "Film" },
          { code: "nauka", label: "Nauka" }
        ])
    });

    const response = await getCategories(createContext("http://test/api/categories", db) as never);
    expect(response.status).toBe(200);
    const data = (await response.json()) as Array<{ code: string; label: string }>;
    expect(data).toHaveLength(2);
    expect(data[0].code).toBe("film");
  });

  it("GET /api/random-person returns person from category", async () => {
    const db = new MockDb({
      "FROM persons p JOIN person_category": () =>
        new MockStatement(
          [],
          {
            id: "tarantino",
            name: "Quentin Tarantino",
            category: "film",
            occupation: "reżyser",
            hints: JSON.stringify(["Hint 1", "Hint 2"])
          }
        ),
      "FROM person_category WHERE person_id": () =>
        new MockStatement([{ category_code: "film" }])
    });

    const response = await getRandomPerson(
      createContext("http://test/api/random-person?category=film", db) as never
    );
    expect(response.status).toBe(200);
    const data = (await response.json()) as {
      id: string;
      name: string;
      category: string;
      categories: string[];
      hints: string[];
    };
    expect(data.category).toBe("film");
    expect(data.categories).toEqual(["film"]);
    expect(data.hints.length).toBe(3);
  });
});
