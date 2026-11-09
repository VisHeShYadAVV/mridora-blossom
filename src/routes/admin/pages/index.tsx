import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { btn, btnOutline, errorText, Field, Message, Title, useAdmin } from "@/components/admin/ui";
import { slugify } from "@/data/catalog";
import { defaultPages, marketLandingTemplate } from "@/data/pages";
import { pageToDraftRow } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { CmsPage } from "@/lib/types";

export const Route = createFileRoute("/admin/pages/")({ component: Pages });

interface Row {
  slug: string;
  title: string;
  state: "Live" | "Unpublished" | "Default content";
  hasDraft: boolean;
  publishAt: string | null;
}

const RESERVED = new Set([
  "admin",
  "api",
  "collections",
  "products",
  "request-a-quote",
  "sitemap",
  "robots",
  "admin-preview",
  "home",
]);

function Pages() {
  const { can } = useAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [market, setMarket] = useState("");

  useEffect(() => {
    void (async () => {
      const [live, drafts] = await Promise.all([
        supabase!.from("pages").select("slug, title, published"),
        supabase!.from("page_drafts").select("slug, title, publish_at"),
      ]);
      if (live.error ?? drafts.error) return setError(errorText(live.error ?? drafts.error));
      const out = new Map<string, Row>();
      for (const p of defaultPages) {
        out.set(p.slug, {
          slug: p.slug,
          title: p.title,
          state: "Default content",
          hasDraft: false,
          publishAt: null,
        });
      }
      for (const p of live.data ?? []) {
        out.set(p.slug, {
          slug: p.slug,
          title: p.title,
          state: p.published ? "Live" : "Unpublished",
          hasDraft: false,
          publishAt: null,
        });
      }
      for (const d of drafts.data ?? []) {
        const cur = out.get(d.slug);
        out.set(d.slug, {
          slug: d.slug,
          title: cur?.title && cur.state === "Live" ? cur.title : d.title,
          state: cur?.state ?? "Unpublished",
          hasDraft: true,
          publishAt: d.publish_at,
        });
      }
      return setRows([...out.values()]);
    })();
  }, []);

  const create = async (name: string, sections: CmsPage["sections"]) => {
    setError("");
    const slug = slugify(name);
    if (!slug || RESERVED.has(slug) || rows.some((r) => r.slug === slug)) {
      return setError(`The address "/${slug}" is reserved or already used. Choose another name.`);
    }
    const page: CmsPage = {
      slug,
      title: name,
      published: false,
      sections,
      seoTitle: `${name} | MRIDORA`,
      seoDescription: "",
      canonical: "",
      ogImage: "",
      noindex: false,
    };
    const { error: err } = await supabase!.from("page_drafts").insert(pageToDraftRow(page));
    if (err) return setError(errorText(err));
    return navigate({ to: "/admin/pages/$slug", params: { slug } });
  };

  return (
    <>
      <Title>Pages</Title>
      <div className="space-y-5">
        <Message kind="error">{error}</Message>
        {can("pages", "edit") && (
          <section className="grid gap-4 border border-border bg-card p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Field label="New page title" value={title} onChange={setTitle} />
              <button
                type="button"
                disabled={!title.trim()}
                onClick={() => void create(title.trim(), [])}
                className={btn}
              >
                Create blank page
              </button>
            </div>
            <div className="space-y-2">
              <Field
                label="New export market landing page (country or region)"
                value={market}
                onChange={setMarket}
                hint="Only describe markets and capabilities you can verify."
              />
              <button
                type="button"
                disabled={!market.trim()}
                onClick={() =>
                  void create(
                    `Ceramic Exporter for ${market.trim()}`,
                    marketLandingTemplate(market.trim()),
                  )
                }
                className={btnOutline}
              >
                Create from template
              </button>
            </div>
          </section>
        )}
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3 font-normal">Page</th>
                <th className="p-3 font-normal">Address</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-t border-border">
                  <td className="p-3">{r.title}</td>
                  <td className="p-3 font-mono text-xs">/{r.slug === "home" ? "" : r.slug}</td>
                  <td className="p-3">
                    {r.state}
                    {r.hasDraft && " · draft saved"}
                    {r.publishAt && ` · scheduled ${new Date(r.publishAt).toLocaleString()}`}
                  </td>
                  <td className="p-3">
                    <Link to="/admin/pages/$slug" params={{ slug: r.slug }} className={btnOutline}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
