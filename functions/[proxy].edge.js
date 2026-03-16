export const config = {
  runtime: 'edge',
};

export default async function handler(request, context) {
  const url = new URL(request.url);
  const route = url.pathname;

  if (route === '/appliances') {
    const geoHeaders = {
      country: request.headers.get('visitor-ip-country'),
      region: request.headers.get('visitor-ip-region'),
      city: request.headers.get('visitor-ip-city'),
      };

    // Contentstack Launch: use context.env (WinterCG runtime has no process object)
    const edgeApiBaseUrl = context?.env?.EDGE_API_BASE_URL;

    console.log('[EDGE] Geo Headers:', geoHeaders);

    const body = {
      source: 'edge',
      geo: geoHeaders,
    };
    if (edgeApiBaseUrl) {
      body.config = { apiBaseUrl: edgeApiBaseUrl };
    }

    // Reproduce CFL-0001: context.waitUntil with a background fetch (valid WinterCG usage)
    context.waitUntil(
      fetch('https://jsonplaceholder.typicode.com/posts/1')
        .then(r => r.json())
        .then(data => console.log('[waitUntil] background result:', data))
    );

    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // fallback: pass through to origin or other logic
  return fetch(request);
}
