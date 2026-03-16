import type { APIRoute } from "astro";

export const prerender = false;

// Simulated in-memory store (replace with a real DB call via import.meta.env.DATABASE_URI)
const USERS: Record<string, { id: string; name: string; email: string }> = {
  "1": { id: "1", name: "Alice", email: "alice@example.com" },
  "2": { id: "2", name: "Bob",   email: "bob@example.com"   },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = ({ params }) => {
  const user = USERS[params.id!];
  if (!user) return json({ error: `User "${params.id}" not found` }, 404);
  return json({ ...user, createdAt: new Date().toISOString() });
};

export const DELETE: APIRoute = ({ params }) => {
  if (!USERS[params.id!]) return json({ error: `User "${params.id}" not found` }, 404);
  delete USERS[params.id!];
  return json({ message: `User "${params.id}" deleted` });
};
