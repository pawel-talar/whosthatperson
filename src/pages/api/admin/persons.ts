import type { APIContext } from "astro";
import { requireAdmin } from "./_utils";

type PersonRow = {
  id: string;
  name: string;
  occupation: string;
  hints: string;
};

type CategoryRow = { category_code: string };
type CountRow = { total: number };

const createId = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 40);

export async function GET(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const url = new URL(context.request.url);
  const q = url.searchParams.get("q")?.trim();
  const limit = Math.min(
    Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1),
    200
  );
  const offset = Math.max(
    Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0,
    0
  );

  const whereClause = q ? "WHERE name LIKE ?1 OR occupation LIKE ?1" : "";
  const queryText = q ? `%${q}%` : "";

  const countStatement = db.prepare(
    `SELECT COUNT(*) as total FROM persons ${whereClause}`
  );
  const countResult = q
    ? await countStatement.bind(queryText).first<CountRow>()
    : await countStatement.first<CountRow>();
  const total = Number(countResult?.total ?? 0);

  const listStatement = db.prepare(
    `SELECT id, name, occupation, hints FROM persons ${whereClause} ORDER BY name ASC LIMIT ?${
      q ? "2" : "1"
    } OFFSET ?${q ? "3" : "2"}`
  );
  const listResult = q
    ? await listStatement.bind(queryText, limit, offset).all<PersonRow>()
    : await listStatement.bind(limit, offset).all<PersonRow>();

  const persons = await Promise.all(
    (listResult.results ?? []).map(async (row) => {
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
        occupation: row.occupation,
        hints: JSON.parse(row.hints) as string[],
        categories
      };
    })
  );

  return new Response(JSON.stringify({ items: persons, total, limit, offset }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const body = await context.request.json().catch(() => null);
  const name = body?.name?.toString().trim();
  const occupation = body?.occupation?.toString().trim();
  const hints = Array.isArray(body?.hints) ? body.hints : [];
  const categories = Array.isArray(body?.categories) ? body.categories : [];

  if (!name || !occupation || hints.length < 3 || categories.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const id = createId(name) || `person-${Date.now()}`;
  const normalizedCategories = categories.map((c: string) =>
    c.toString().trim().toLowerCase()
  );

  await db
    .prepare(
      "INSERT OR REPLACE INTO persons (id, name, category, occupation, hints) VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(id, name, normalizedCategories[0], occupation, JSON.stringify(hints))
    .run();

  const categoryStatements = normalizedCategories.map((code: string) =>
    db
      .prepare(
        "INSERT OR IGNORE INTO person_category (person_id, category_code) VALUES (?1, ?2)"
      )
      .bind(id, code)
  );
  await db.batch(categoryStatements);

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
