export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const asset = await env.ASSETS.fetch(new Request(new URL(assetPath, url.origin)));

    if (asset.status === 404) {
      return new Response('Not Found', { status: 404 });
    }

    return asset;
  },
};
