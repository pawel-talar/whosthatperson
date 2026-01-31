import type { APIContext } from "astro";
import { maskName } from "../../utils/maskName";
import type { Person } from "../../types/person";

type PersonRow = {
  id: string;
  name: string;
  category: string;
  occupation: string;
  hints: string;
};
type CategoryRow = { category_code: string };

const getDb = (locals: APIContext["locals"]) =>
  (locals.runtime as { env?: Env } | undefined)?.env?.DB;

const mapRow = async (db: D1Database, row: PersonRow): Promise<Person> => {
  const categoryResult = await db
    .prepare("SELECT category_code FROM person_category WHERE person_id = ?1")
    .bind(row.id)
    .all<CategoryRow>();
  const categories = (categoryResult.results ?? []).map(
    (entry) => entry.category_code
  );

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categories,
    occupation: row.occupation,
    hints: [maskName(row.name), ...(JSON.parse(row.hints) as string[])]
  };
};

export async function GET({ request, locals }: APIContext) {
  const db = getDb(locals);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const normalizedCategory = category?.toLowerCase() ?? null;

  const statement = normalizedCategory
    ? db
        .prepare(
          "SELECT p.id, p.name, p.category, p.occupation, p.hints FROM persons p JOIN person_category pc ON pc.person_id = p.id WHERE pc.category_code = ?1 ORDER BY RANDOM() LIMIT 1"
        )
        .bind(normalizedCategory)
    : db.prepare(
        "SELECT id, name, category, occupation, hints FROM persons ORDER BY RANDOM() LIMIT 1"
      );

  const row = (await statement.first()) as PersonRow | null;
  if (!row) {
    return new Response(JSON.stringify({ error: "No persons found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const person = await mapRow(db, row);
  return new Response(JSON.stringify(person), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
