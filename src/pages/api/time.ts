import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const now = new Date();

  // Optional: timezone query param
  const tz = url.searchParams.get("tz") ?? "UTC";

  let formatted: string;
  try {
    formatted = now.toLocaleString("en-US", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    formatted = now.toUTCString();
  }

  const data = {
    feature: "Astro API Route — Real-time Server Data",
    iso: now.toISOString(),
    unix: Math.floor(now.getTime() / 1000),
    timezone: tz,
    formatted,
    requestId: locals.requestId,
    note: "This timestamp is generated on the server at request time — not at build time.",
  };

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache",
    },
  });
};
