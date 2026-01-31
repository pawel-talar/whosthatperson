import type { APIRoute } from "astro";

type Env = {
  ROOM_DO: DurableObjectNamespace;
};

export const GET: APIRoute = async ({ params, locals }) => {
  const roomId = params.id;
  if (!roomId) {
    return new Response(JSON.stringify({ error: "Room id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const env = (locals as { runtime: { env: Env } }).runtime.env;
  const id = env.ROOM_DO.idFromName(roomId);
  const stub = env.ROOM_DO.get(id);

  const response = await stub.fetch("https://room/state");
  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": "application/json" }
  });
};
