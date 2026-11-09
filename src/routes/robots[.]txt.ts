import { createFileRoute } from "@tanstack/react-router";

import { getSiteData } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { settings } = await getSiteData();
        const body = `${settings.seo.robotsTxt.trim()}\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`;
        return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
