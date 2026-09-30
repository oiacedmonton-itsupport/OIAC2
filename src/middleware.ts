import { defineMiddleware } from 'astro:middleware';

const ADMIN_COOKIE_NAME = 'oiac_admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple hash function for session token
function createSessionToken(password: string, timestamp: number): string {
  const data = `${password}-${timestamp}-oiac-admin-secret`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36) + '-' + timestamp.toString(36);
}

function verifySessionToken(token: string, password: string): boolean {
  if (!token || !password) return false;

  const parts = token.split('-');
  if (parts.length !== 2) return false;

  const timestamp = parseInt(parts[1], 36);
  if (isNaN(timestamp)) return false;

  // Check if session expired
  if (Date.now() - timestamp > SESSION_DURATION) return false;

  // Verify token matches
  const expectedToken = createSessionToken(password, timestamp);
  return token === expectedToken;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // CMS API: writes (and private listings) require an admin session.
  // Public GETs stay open for read-only consumers.
  const normalizedPath = pathname.replace(/\/{2,}/g, '/').toLowerCase();
  if (normalizedPath.startsWith('/api/cms/')) {
    const isPrivateRead = normalizedPath.startsWith('/api/cms/media') || normalizedPath.startsWith('/api/cms/feedback');
    const isRead = context.request.method === 'GET' || context.request.method === 'HEAD';
    if (isRead && !isPrivateRead) {
      return next();
    }

    const adminPassword = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      // Never leave service-role writes open on a deployed build that is missing the password
      if (import.meta.env.PROD) {
        return new Response(JSON.stringify({ error: 'Admin password not configured' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return next();
    }

    const sessionCookie = context.cookies.get(ADMIN_COOKIE_NAME);
    if (sessionCookie && verifySessionToken(sessionCookie.value, adminPassword)) {
      return next();
    }

    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only protect /admin routes (except login page and API)
  if (!pathname.startsWith('/admin')) {
    return next();
  }

  // Allow login page and login API
  if (pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
    return next();
  }

  // Get password from environment
  const adminPassword = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  // If no password is set, allow access (for development or if feature is disabled)
  if (!adminPassword) {
    return next();
  }

  // Check for session cookie
  const sessionCookie = context.cookies.get(ADMIN_COOKIE_NAME);

  if (sessionCookie && verifySessionToken(sessionCookie.value, adminPassword)) {
    // Valid session, allow access
    return next();
  }

  // No valid session, redirect to login
  return context.redirect('/admin/login?redirect=' + encodeURIComponent(pathname));
});

// Export helper functions for use in API routes
export { createSessionToken, ADMIN_COOKIE_NAME, SESSION_DURATION };
