// Rewrites public Supabase Storage URLs (bucket `media`) to the same-origin /media/* proxy,
// so images are served from Vercel's CDN cache instead of counting against Supabase egress.
// Use only at public render sites — admin pages keep raw URLs so they are never saved back to the DB.
// Set MEDIA_PROXY=off to disable.

const STORAGE_PREFIX = '/storage/v1/object/public/media/';

const supabaseHost = (() => {
  try {
    return new URL(import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '').host;
  } catch {
    return '';
  }
})();

const proxyDisabled = (import.meta.env.MEDIA_PROXY || process.env.MEDIA_PROXY) === 'off';

export function mediaUrl(url: string): string;
export function mediaUrl(url: string | null | undefined): string | null | undefined;
export function mediaUrl(url: string | null | undefined) {
  if (!url || !supabaseHost || proxyDisabled) return url;
  try {
    // Relative paths like /images/uploads/... throw here and are returned unchanged
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && parsed.host === supabaseHost && parsed.pathname.startsWith(STORAGE_PREFIX) && !parsed.search) {
      return '/media/' + parsed.pathname.slice(STORAGE_PREFIX.length);
    }
  } catch {
    // fall through
  }
  return url;
}
