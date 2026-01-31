/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  ROOM_DO: DurableObjectNamespace;
}
