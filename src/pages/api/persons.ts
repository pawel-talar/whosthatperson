import { mockPersons } from "../../data/mockPersons";

export async function GET() {
  return new Response(JSON.stringify(mockPersons), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
