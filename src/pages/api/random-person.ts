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

const getDb = (locals: APIContext["locals"]) =>
  (locals.runtime as { env?: Env } | undefined)?.env?.DB;

const mapRow = (row: PersonRow): Person => ({
  id: row.id,
  name: row.name,
  category: row.category,
  occupation: row.occupation,
  hints: [maskName(row.name), ...(JSON.parse(row.hints) as string[])]
});

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

  const statement = category
    ? db
        .prepare(
          "SELECT id, name, category, occupation, hints FROM persons WHERE category = ?1 ORDER BY RANDOM() LIMIT 1"
        )
        .bind(category)
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

  return new Response(JSON.stringify(mapRow(row)), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
