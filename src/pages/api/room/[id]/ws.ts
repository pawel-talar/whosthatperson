import type { APIRoute } from "astro";

type Env = {
  ROOM_DO: DurableObjectNamespace;
};

export const GET: APIRoute = async ({ params, request, locals }) => {
  const roomId = params.id;
  if (!roomId) {
    return new Response("Room id required", { status: 400 });
  }

  const env = (locals as { runtime: { env: Env } }).runtime.env;
  const id = env.ROOM_DO.idFromName(roomId);
  const stub = env.ROOM_DO.get(id);

  const response = await stub.fetch(request);
  return response;
};
