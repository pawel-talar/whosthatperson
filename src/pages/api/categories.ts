import type { APIContext } from "astro";

type CategoryRow = {
  code: string;
  label: string;
};

const getDb = (locals: APIContext["locals"]) =>
  (locals.runtime as { env?: Env } | undefined)?.env?.DB;

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
    .prepare("SELECT code, label FROM category ORDER BY label ASC")
    .all<CategoryRow>();

  return new Response(JSON.stringify(result.results ?? []), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
