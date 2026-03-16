// Required — tells Contentstack Launch to deploy this file as an Edge Function.
export const config = {
  runtime: 'edge',
};

export default async function handler(request, context) {
  const url = new URL(request.url);
  const { pathname } = url;

  // ------------------------------------------------------------------
  // 1. Geo-based routing — redirect visitors from a specific region
  // ------------------------------------------------------------------
  if (pathname === '/') {
    const country = request.headers.get('visitor-ip-country') ?? '';
    const region  = request.headers.get('visitor-ip-region')  ?? '';
    const city    = request.headers.get('visitor-ip-city')    ?? '';

    console.log('[EDGE] Geo:', { country, region, city });

    if (country === 'IN') {
      return Response.redirect(new URL('/in', url), 302);
    }
  }

  // ------------------------------------------------------------------
  // 2. A/B test — split traffic 50/50 between two variants on /landing
  // ------------------------------------------------------------------
  if (pathname === '/landing') {
    const variant    = Math.random() < 0.5 ? 'a' : 'b';
    const variantUrl = new URL(`/landing-${variant}`, url);

    // context.waitUntil: log in background without delaying the response
    context.waitUntil(
      Promise.resolve().then(() =>
        console.log(`[EDGE] A/B variant served: ${variant}`)
      )
    );

    const response         = await fetch(new Request(variantUrl.toString(), request));
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-AB-Variant', variant);
    return modifiedResponse;
  }

  // ------------------------------------------------------------------
  // 3. Security headers — added to every response that reaches the origin
  // ------------------------------------------------------------------
  const originResponse = await fetch(request);
  const secureResponse = new Response(originResponse.body, originResponse);
  secureResponse.headers.set('X-Frame-Options', 'DENY');
  secureResponse.headers.set('X-Content-Type-Options', 'nosniff');
  secureResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return secureResponse;
}
