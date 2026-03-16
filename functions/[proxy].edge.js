// Edge Function — runs at the nearest CDN edge POP before the request reaches the origin.
// File must be named [proxy].edge.js and placed inside /functions.
// Uses the WinterCG-compliant Fetch API (Request / Response), NOT Node.js APIs.
//
// Execution order (highest → lowest priority):
//   launch.json redirects → launch.json rewrites → Edge Function → Origin

export default async function handler(request, context) {
  const url = new URL(request.url);
  const { pathname } = url;

  // ------------------------------------------------------------------
  // 1. Geo-based routing — redirect visitors from a specific region
  // ------------------------------------------------------------------
  const country = request.headers.get("x-cs-country") ?? "";
  if (country === "IN" && pathname === "/") {
    return Response.redirect(new URL("/in", url), 302);
  }

  // ------------------------------------------------------------------
  // 2. A/B test — split traffic 50/50 between two variants
  // ------------------------------------------------------------------
  if (pathname === "/landing") {
    const variant = Math.random() < 0.5 ? "a" : "b";
    const variantUrl = new URL(`/landing-${variant}`, url);
    const response = await fetch(new Request(variantUrl.toString(), request));
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set("X-AB-Variant", variant);
    return modifiedResponse;
  }

  // ------------------------------------------------------------------
  // 3. Proxy /external/* to a third-party microservice, injecting an API key
  //    NOTE: Do NOT intercept /api/* — those are served by the Astro SSR origin.
  // ------------------------------------------------------------------
  if (pathname.startsWith("/external/")) {
    const apiKey = context.env.EXTERNAL_API_KEY ?? "";
    const upstream = new URL(
      pathname.replace("/external/", "/v1/"),
      "https://external-service.example.com"
    );
    upstream.search = url.search;

    const proxiedRequest = new Request(upstream.toString(), {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    });
    proxiedRequest.headers.set("X-Api-Key", apiKey);

    const apiResponse = await fetch(proxiedRequest);
    const modifiedApiResponse = new Response(apiResponse.body, apiResponse);
    modifiedApiResponse.headers.set("X-Powered-By", "Contentstack Launch");
    return modifiedApiResponse;
  }

  // ------------------------------------------------------------------
  // 4. Add security headers to every other response
  // ------------------------------------------------------------------
  const originResponse = await fetch(request);
  const secureResponse = new Response(originResponse.body, originResponse);
  secureResponse.headers.set("X-Frame-Options", "DENY");
  secureResponse.headers.set("X-Content-Type-Options", "nosniff");
  secureResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return secureResponse;
}
