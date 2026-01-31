import type { APIContext } from "astro";

const getDb = (locals: APIContext["locals"]) =>
  (locals.runtime as { env?: Env } | undefined)?.env?.DB;

const isAuthorized = (request: Request) => {
  const hostname = new URL(request.url).hostname;
  if (import.meta.env.DEV || hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  return Boolean(jwt || email);
};

export const requireAdmin = (context: APIContext) => {
  const db = getDb(context.locals);
  if (!db) {
    return { error: new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    }) };
  }
  if (!isAuthorized(context.request)) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    }) };
  }
  return { db };
};
