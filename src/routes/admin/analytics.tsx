import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { errorText, input, Message, Title, useAdmin } from "@/components/admin/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/analytics")({ component: Page });

interface Row {
  label: string;
  value: number;
}
interface Summary {
  visitors: number;
  pageviews: number;
  rfqEvents: number;
  countries: Row[];
  sources: Row[];
  pages: Row[];
  products: Row[];
  collections: Row[];
  searches: Row[];
  daily: Row[];
}

function Ranking({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="border border-border bg-card p-4">
      <h2 className="text-lg text-primary">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-sm" title={`${r.label}: ${r.value.toLocaleString()}`}>
              <div className="flex justify-between gap-3">
                <span className="truncate">{r.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.value.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1.5">
                <div
                  className="h-full rounded-r bg-primary"
                  style={{ width: `${(r.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Trend({ rows }: { rows: Row[] }) {
  const [hover, setHover] = useState<Row | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const peak = rows.reduce<Row | null>(
    (best, r) => (!best || r.value > best.value ? r : best),
    null,
  );
  return (
    <section className="border border-border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <h2 className="text-lg text-primary">Visitors per day</h2>
        <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {hover
            ? `${hover.label}: ${hover.value.toLocaleString()}`
            : peak
              ? `Peak ${peak.label}: ${peak.value.toLocaleString()}`
              : ""}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No visits recorded in this period.</p>
      ) : (
        <div
          className="mt-4 flex h-40 items-end gap-0.5 border-b border-border"
          role="img"
          aria-label={`Visitors per day. ${peak ? `Peak of ${peak.value} on ${peak.label}.` : ""}`}
          onMouseLeave={() => setHover(null)}
        >
          {rows.map((r) => (
            <div
              key={r.label}
              onMouseEnter={() => setHover(r)}
              className="flex h-full min-w-0 flex-1 items-end"
            >
              <div
                className="w-full rounded-t bg-primary hover:bg-gold"
                style={{ height: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl text-primary">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function Page() {
  const { can } = useAdmin();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rfqs, setRfqs] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setError("");
      const { data, error: err } = await supabase!.rpc("analytics_summary", { p_days: days });
      if (err) return setError(errorText(err));
      setSummary(data as Summary);
      if (can("enquiries", "read")) {
        const since = new Date(Date.now() - days * 86_400_000).toISOString();
        const res = await supabase!
          .from("rfqs")
          .select("*", { count: "exact", head: true })
          .gte("created_at", since);
        setRfqs(res.error ? null : (res.count ?? 0));
      }
      return undefined;
    })();
  }, [days, can]);

  const conversion =
    summary && rfqs !== null && summary.visitors > 0
      ? `${((rfqs / summary.visitors) * 100).toFixed(1)}%`
      : "Unavailable";

  return (
    <>
      <Title
        actions={
          <select
            aria-label="Period"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={`${input} mt-0`}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 12 months</option>
          </select>
        }
      >
        Analytics
      </Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <p className="text-sm text-muted-foreground">
          Measured on this website, only for visitors who accepted analytics, so figures undercount
          real traffic. Visitors are counted per browser session.
        </p>
        {summary && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Visitors" value={summary.visitors.toLocaleString()} />
              <Tile label="Page views" value={summary.pageviews.toLocaleString()} />
              <Tile
                label="Enquiries received"
                value={rfqs === null ? "Unavailable" : rfqs.toLocaleString()}
                {...(rfqs === null ? { note: "Needs enquiry access" } : {})}
              />
              <Tile
                label="RFQ conversion rate"
                value={conversion}
                note="Enquiries ÷ measured visitors. Can read high, as all enquiries count but not all visitors."
              />
            </div>
            <Trend rows={summary.daily} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Ranking
                title="Visitors by country"
                rows={summary.countries}
                empty="Not measured. Country needs hosting that provides a country header, such as Cloudflare."
              />
              <Ranking title="Traffic sources" rows={summary.sources} empty="No visits recorded." />
              <Ranking title="Top landing pages" rows={summary.pages} empty="No visits recorded." />
              <Ranking
                title="Most viewed collections"
                rows={summary.collections}
                empty="No collection views recorded."
              />
              <Ranking
                title="Most viewed products"
                rows={summary.products}
                empty="No product views recorded."
              />
              <Ranking
                title="Website search keywords"
                rows={summary.searches}
                empty="No searches recorded."
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
