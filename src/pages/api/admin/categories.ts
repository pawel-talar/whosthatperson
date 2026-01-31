import type { APIContext } from "astro";
import { requireAdmin } from "./_utils";

type CategoryRow = {
  code: string;
  label: string;
};

export async function GET(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const result = await db
    .prepare("SELECT code, label FROM category ORDER BY label ASC")
    .all<CategoryRow>();

  return new Response(JSON.stringify(result.results ?? []), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(context: APIContext) {
  const { db, error } = requireAdmin(context);
  if (error) return error;

  const body = await context.request.json().catch(() => null);
  const code = body?.code?.toString().trim().toLowerCase();
  const label = body?.label?.toString().trim();

  if (!code || !label) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  await db
    .prepare("INSERT OR IGNORE INTO category (code, label) VALUES (?1, ?2)")
    .bind(code, label)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
