import type { APIContext } from "astro";
import { requireAdmin } from "../_utils";

type CategoryRow = { category_code: string };

export async function DELETE(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const id = context.params.id?.toString().trim();
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid person id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const statements = [
    db.prepare("DELETE FROM person_category WHERE person_id = ?1").bind(id),
    db.prepare("DELETE FROM persons WHERE id = ?1").bind(id)
  ];
  await db.batch(statements);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function PUT(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const id = context.params.id?.toString().trim();
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid person id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

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

  const normalizedCategories = categories.map((code: string) =>
    code.toString().trim().toLowerCase()
  );

  await db
    .prepare(
      "UPDATE persons SET name = ?1, occupation = ?2, category = ?3, hints = ?4 WHERE id = ?5"
    )
    .bind(
      name,
      occupation,
      normalizedCategories[0],
      JSON.stringify(hints),
      id
    )
    .run();

  const statements = [
    db.prepare("DELETE FROM person_category WHERE person_id = ?1").bind(id),
    ...normalizedCategories.map((code: string) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO person_category (person_id, category_code) VALUES (?1, ?2)"
        )
        .bind(id, code)
    )
  ];
  await db.batch(statements);

  const categoriesResult = await db
    .prepare("SELECT category_code FROM person_category WHERE person_id = ?1")
    .bind(id)
    .all<CategoryRow>();
  const savedCategories = (categoriesResult.results ?? []).map(
    (row) => row.category_code
  );

  return new Response(
    JSON.stringify({
      ok: true,
      id,
      categories: savedCategories
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
