import type { APIRoute } from "astro";

export const prerender = false;

// GET: echo query params back
export const GET: APIRoute = async ({ url, locals, request }) => {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    // Exclude sensitive/noisy headers
    if (!["cookie", "authorization"].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  return new Response(
    JSON.stringify(
      {
        feature: "Echo API Route",
        method: "GET",
        query: params,
        headers,
        requestId: locals.requestId,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }
  );
};

// POST: echo the request body back
export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown = null;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      body = await request.text();
    }
  } catch {
    body = null;
  }

  return new Response(
    JSON.stringify(
      {
        feature: "Echo API Route",
        method: "POST",
        receivedBody: body,
        requestId: locals.requestId,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    }
  );
};
