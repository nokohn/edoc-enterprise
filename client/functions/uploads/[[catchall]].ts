export const onRequest: PagesFunction<{ BACKEND_URL?: string }> = async (context) => {
  const url = new URL(context.request.url);
  const backendBase = context.env.BACKEND_URL || 'https://south-comes-reliability-stanford.trycloudflare.com';
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  return fetch(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
  });
};
