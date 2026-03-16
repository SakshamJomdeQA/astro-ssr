// Cloud Function: /user/:id
// Dynamic path segment — the filename [id].js maps to req.params.id
// Accessible at: GET /user/123, DELETE /user/123, etc.

import { formatUser, sendError } from "../utils.js";

// Simulated in-memory store (replace with a real DB call via process.env.DATABASE_URI)
const USERS = {
  "1": { id: "1", name: "Alice", email: "alice@example.com" },
  "2": { id: "2", name: "Bob",   email: "bob@example.com"   },
};

export default async function handler(req, res) {
  const { id } = req.params;

  if (req.method === "GET") {
    const user = USERS[id];
    if (!user) return sendError(res, 404, `User "${id}" not found`);
    return res.status(200).json(formatUser(user));
  }

  if (req.method === "DELETE") {
    if (!USERS[id]) return sendError(res, 404, `User "${id}" not found`);
    delete USERS[id];
    return res.status(200).json({ message: `User "${id}" deleted` });
  }

  sendError(res, 405, `Method ${req.method} not allowed`);
}
