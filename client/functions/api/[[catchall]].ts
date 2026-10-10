export const onRequest: PagesFunction<{ BACKEND_URL?: string }> = async (context) => {
  const url = new URL(context.request.url);
  // Default to active tunnel URL or environment variable
  const backendBase = context.env.BACKEND_URL || 'https://ticket-inline-institutional-msgstr.trycloudflare.com';
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  // Forward the original request with all headers and body
  const requestInit: RequestInit = {
    method: context.request.method,
    headers: context.request.headers,
    redirect: 'follow',
  };

  // Only pass body for non-GET/HEAD requests
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    requestInit.body = context.request.body;
  }

  return fetch(targetUrl.toString(), requestInit);
};
