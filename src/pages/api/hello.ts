import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals, request }) => {
  const data = {
    message: "Hello from Astro API route! 👋",
    feature: "Astro API Routes (SSR)",
    timestamp: new Date().toISOString(),
    requestId: locals.requestId,
    url: request.url,
    method: request.method,
    runtime: "Node.js via @astrojs/node adapter",
    deployedOn: "Contentstack Launch",
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
};
