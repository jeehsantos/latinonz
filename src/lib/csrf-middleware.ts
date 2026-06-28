import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * CSRF guard for all server functions.
 *
 * Server functions are POST RPC endpoints reachable from any origin. Without a
 * same-origin check, a third-party site could submit a logged-in user's
 * browser-bearing-cookies request and execute mutations on their behalf.
 *
 * We enforce same-origin by comparing the request's `Origin` (or `Referer`
 * fallback) header against the request URL's own origin and any explicitly
 * allowlisted production origins.
 *
 * Safe methods (GET/HEAD/OPTIONS) are skipped since they should not mutate
 * state.
 */
export const csrfGuard = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const request = getRequest();
  if (!request) return next();

  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const requestOrigin = safeOrigin(request.url);
  const allowed = new Set<string>();
  if (requestOrigin) allowed.add(requestOrigin);

  // Add explicit production / custom-domain origins via env when configured.
  for (const value of [
    process.env.PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VITE_PUBLIC_SITE_URL,
  ]) {
    const origin = value ? safeOrigin(value) : null;
    if (origin) allowed.add(origin);
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const candidate = originHeader ?? (refererHeader ? safeOrigin(refererHeader) : null);

  if (!candidate || !allowed.has(candidate)) {
    throw new Response("Forbidden: cross-origin request blocked", { status: 403 });
  }

  return next();
});

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
