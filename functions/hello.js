// Cloud Function: /hello
// Demonstrates reading body, query params, and cookies from the request.
// Accessible at: GET /hello or POST /hello

export default function handler(req, res) {
  if (req.method === "POST") {
    let body;
    try {
      body = req.body;
    } catch {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }

    return res.status(200).json({
      message: "Hello from Launch Cloud Function (POST)!",
      body,
      query: req.query,
      cookies: req.cookies,
    });
  }

  // Default: GET
  res.status(200).json({
    message: "Hello from Launch Cloud Function!",
    query: req.query,
    cookies: req.cookies,
    env: process.env.NODE_ENV,
  });
}
