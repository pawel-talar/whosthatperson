import { mockPersons } from "../../data/mockPersons";

export async function GET({ request }: { request: Request }) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const pool = category
    ? mockPersons.filter((person) => person.category === category)
    : mockPersons;

  if (pool.length === 0) {
    return new Response(JSON.stringify({ error: "No persons found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  const randomPerson = pool[Math.floor(Math.random() * pool.length)];

  return new Response(JSON.stringify(randomPerson), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
