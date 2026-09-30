import type { APIRoute } from 'astro';

// Same-origin proxy for the public Supabase `media` bucket (see src/lib/media-url.ts).
// Uploaded filenames are timestamped and never overwritten, so responses are cached as immutable
// on Vercel's CDN; Supabase is only hit on a regional cache miss.

const supabaseUrl = (import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SAFE_PATH = /^[A-Za-z0-9._\-\/ ()%]+$/;
const ONE_YEAR = 'public, max-age=31536000, immutable';

export const GET: APIRoute = async ({ params, url }) => {
  const path = params.path ?? '';
  // Query strings would make every request a CDN cache miss (and a Supabase download)
  if (!supabaseUrl || !path || url.search || path.includes('..') || !SAFE_PATH.test(path)) {
    return new Response('Not found', { status: 404 });
  }

  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const upstream = await fetch(`${supabaseUrl}/storage/v1/object/public/media/${encodedPath}`, {
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);

  if (!upstream || !upstream.ok) {
    const notFound = upstream?.status === 400 || upstream?.status === 404;
    return new Response('Not found', {
      status: notFound ? 404 : 502,
      // Never cache upstream outages (e.g. a quota restriction) for long
      headers: { 'Cache-Control': notFound ? 'public, max-age=60, s-maxage=300' : 'no-store' },
    });
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
    'Cache-Control': ONE_YEAR,
    'Vercel-CDN-Cache-Control': ONE_YEAR,
    // Files are now same-origin: stop uploaded SVG/HTML from running scripts on this domain
    'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    'X-Content-Type-Options': 'nosniff',
  });
  // fetch() decompresses the body, so a compressed upstream's content-length would be wrong
  const copyHeaders = upstream.headers.get('content-encoding') ? ['etag', 'last-modified'] : ['content-length', 'etag', 'last-modified'];
  for (const key of copyHeaders) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }

  return new Response(upstream.body, { status: 200, headers });
};
