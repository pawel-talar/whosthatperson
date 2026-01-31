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

export async function GET({ locals }: APIContext) {
  const db = getDb(locals);
  if (!db) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const result = await db
    .prepare("SELECT id, name, category, occupation, hints FROM persons")
    .all<PersonRow>();
  const persons = (result.results ?? []).map(mapRow);

  return new Response(JSON.stringify(persons), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
