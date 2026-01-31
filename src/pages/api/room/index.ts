import type { APIRoute } from "astro";

type Env = {
  ROOM_DO: DurableObjectNamespace;
};

const createRoomId = () => Math.random().toString(36).slice(2, 8);
const createHostKey = () => Math.random().toString(36).slice(2, 10);

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  const name = body?.name?.toString().trim();

  if (!name) {
    return new Response(JSON.stringify({ error: "Name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const roomId = createRoomId();
  const hostKey = createHostKey();
  const env = (locals as { runtime: { env: Env } }).runtime.env;
  const id = env.ROOM_DO.idFromName(roomId);
  const stub = env.ROOM_DO.get(id);

  const response = await stub.fetch("https://room/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId, hostKey })
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Failed to create room" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/room/${roomId}`;

  return new Response(
    JSON.stringify({ roomId, hostKey, inviteUrl }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
};
