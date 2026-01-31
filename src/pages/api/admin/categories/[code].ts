import type { APIContext } from "astro";
import { requireAdmin } from "../_utils";

export async function DELETE(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const code = context.params.code?.toString().trim().toLowerCase();
  if (!code) {
    return new Response(JSON.stringify({ error: "Invalid category code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const statements = [
    db.prepare("DELETE FROM person_category WHERE category_code = ?1").bind(code),
    db.prepare("DELETE FROM category WHERE code = ?1").bind(code)
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

  const code = context.params.code?.toString().trim().toLowerCase();
  if (!code) {
    return new Response(JSON.stringify({ error: "Invalid category code" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = await context.request.json().catch(() => null);
  const label = body?.label?.toString().trim();

  if (!label) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  await db
    .prepare("UPDATE category SET label = ?1 WHERE code = ?2")
    .bind(label, code)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
