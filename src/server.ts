import "./lib/error-capture";

import { getSiteData } from "./lib/data";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Redirects and maintenance mode, both configured in the admin panel. */
async function siteRules(request: Request): Promise<Response | null> {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
  // Assets and framework requests are never redirected or blocked.
  if (/\.[a-z0-9]+$/i.test(path) && path !== "/sitemap.xml" && path !== "/robots.txt") return null;
  if (path.startsWith("/_") || path.startsWith("/api/")) return null;
  const { redirects, settings } = await getSiteData();
  const redirect = redirects.find((r) => r.from === path);
  if (redirect) {
    const target = redirect.to.startsWith("/")
      ? new URL(redirect.to, url.origin).toString()
      : redirect.to;
    return Response.redirect(target, redirect.code);
  }
  if (settings.technical.maintenance && !path.startsWith("/admin")) {
    const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(settings.brandName)}</title></head><body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:1.5rem;text-align:center;background:#fbf9f3;color:#1e2740"><main><h1 style="font-weight:500">${escapeHtml(settings.brandName)}</h1><p>${escapeHtml(settings.technical.maintenanceMessage)}</p></main></body></html>`;
    return new Response(body, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "retry-after": "3600" },
    });
  }
  return null;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const rule = await siteRules(request);
      if (rule) return rule;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
