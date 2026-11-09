import { createFileRoute } from "@tanstack/react-router";

import { supabase } from "@/lib/supabase";

const TYPES = new Set(["pageview", "product_view", "collection_view", "search", "rfq"]);
const BOT = /bot|crawl|spider|slurp|headless|lighthouse/i;
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : "";
const empty = () => new Response(null, { status: 204 });

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!supabase || BOT.test(request.headers.get("user-agent") ?? "")) return empty();
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return empty();
        }
        if (!TYPES.has(String(body["type"]))) return empty();
        const country = request.headers.get("cf-ipcountry") ?? "";
        const { error } = await supabase.from("analytics_events").insert({
          type: body["type"],
          path: text(body["path"], 300),
          label: text(body["label"], 200),
          source: text(body["source"], 100),
          session_id: text(body["sessionId"], 64),
          // XX and T1 are Cloudflare's "unknown" and "Tor" values.
          country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : "",
        });
        if (error) console.error("Failed to record event", error.message);
        return empty();
      },
    },
  },
});
