import { createFileRoute } from "@tanstack/react-router";

import { getPages, getProducts, getSiteData } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

const CODE_ROUTES = ["/collections", "/request-a-quote"];
const escapeXml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [{ collections, subcategories, settings }, products, pages] = await Promise.all([
          getSiteData(),
          getProducts(),
          getPages(),
        ]);
        const urls = [
          ...pages
            .filter((p) => p.published && !p.noindex)
            .map((p) => p.canonical || (p.slug === "home" ? "/" : `/${p.slug}`)),
          ...CODE_ROUTES,
          ...collections.map((c) => `/collections/${c.slug}`),
          ...subcategories.flatMap((s) => {
            const c = collections.find((x) => x.code === s.collectionCode);
            return c ? [`/collections/${c.slug}/${s.slug}`] : [];
          }),
          // Sample listings are noindex, so they stay out of the sitemap.
          ...(settings.seo.sitemapProducts
            ? products.filter((p) => !p.isSample).map((p) => p.canonical || `/products/${p.slug}`)
            : []),
        ];
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${escapeXml(absoluteUrl(u))}</loc></url>`).join("\n")}\n</urlset>\n`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
