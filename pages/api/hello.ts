import type { APIRoute } from "astro";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const GET: APIRoute = ({ locals, request }) => {
  return json({
    message: "Hello from Astro API route!",
    timestamp: new Date().toISOString(),
    requestId: locals.requestId,
    url: request.url,
    method: request.method,
    env: import.meta.env.MODE,
  });
};

export const POST: APIRoute = async ({ locals, request }) => {
  let body: unknown = null;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = Object.fromEntries(await request.formData());
    } else {
      body = await request.text();
    }
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  return json({
    message: "Hello from Astro API route (POST)!",
    requestId: locals.requestId,
    body,
  });
};
