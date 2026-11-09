import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { MediaField } from "@/components/admin/media";
import { seoIssues } from "@/components/admin/SeoPreview";
import {
  Area,
  btn,
  btnDanger,
  btnOutline,
  Check,
  errorText,
  Field,
  input,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { defaultCollections, defaultSubcategories } from "@/data/catalog";
import { defaultPages } from "@/data/pages";
import { loadAllProducts } from "@/lib/admin-products";
import {
  clearDataCache,
  collectionFromRow,
  pageFromRow,
  settingsFromRows,
  settingsToRows,
  subcategoryFromRow,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/seo")({ component: Page });

interface Item {
  kind: string;
  name: string;
  path: string;
  issues: string[];
  edit: { to: string; params?: Record<string, string> };
}
interface RedirectRow {
  id: string;
  from_path: string;
  to_path: string;
  code: number;
  active: boolean;
}

function Page() {
  const { can } = useAdmin();
  const [items, setItems] = useState<Item[]>([]);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState(301);
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canEdit = can("seo", "edit");

  const loadRedirects = async () => {
    const { data, error: err } = await supabase!.from("redirects").select("*").order("from_path");
    if (err) return setError(errorText(err));
    return setRedirects((data ?? []) as RedirectRow[]);
  };

  useEffect(() => {
    void (async () => {
      try {
        const [settings, pages, drafts, collections, subs, products] = await Promise.all([
          supabase!.from("site_settings").select("key, value"),
          supabase!.from("pages").select("*"),
          supabase!.from("page_drafts").select("slug"),
          supabase!.from("collections").select("*"),
          supabase!.from("subcategories").select("*"),
          loadAllProducts(),
        ]);
        setS(settingsFromRows(settings.data ?? []));
        const live = (pages.data ?? []).map(pageFromRow);
        const slugs = new Set(live.map((p) => p.slug));
        const allPages = [
          ...live.filter((p) => p.published),
          ...defaultPages.filter((p) => !slugs.has(p.slug)),
        ];
        const cols = collections.data?.length
          ? collections.data.map(collectionFromRow)
          : defaultCollections;
        const subList = subs.data?.length
          ? subs.data.map(subcategoryFromRow)
          : defaultSubcategories;
        const out: Item[] = [
          ...allPages.map((p) => ({
            kind: "Page",
            name: p.title,
            path: p.slug === "home" ? "/" : `/${p.slug}`,
            issues: seoIssues(p.seoTitle, p.seoDescription),
            edit: { to: "/admin/pages/$slug", params: { slug: p.slug } },
          })),
          ...cols.map((c) => ({
            kind: "Collection",
            name: c.name,
            path: `/collections/${c.slug}`,
            issues: seoIssues(c.seoTitle, c.seoDescription),
            edit: { to: "/admin/collections" },
          })),
          ...subList.map((x) => ({
            kind: "Subcategory",
            name: x.name,
            path: `/collections/${cols.find((c) => c.code === x.collectionCode)?.slug ?? ""}/${x.slug}`,
            issues: seoIssues(x.seoTitle, x.seoDescription),
            edit: { to: "/admin/collections" },
          })),
          // Sample listings are noindex, so their metadata doesn't matter.
          ...products
            .filter((p) => !p.isSample && p.status === "active")
            .map((p) => {
              const issues: string[] = [];
              if (!p.overview) issues.push("Missing overview");
              if (p.images.length === 0) issues.push("No photographs");
              else if (p.images.some((_, i) => !p.imageAlts[i]))
                issues.push("Image missing alt text");
              return {
                kind: "Product",
                name: `${p.name} (${p.sku})`,
                path: `/products/${p.slug}`,
                issues,
                edit: { to: "/admin/products/$id", params: { id: p.id } },
              };
            }),
        ];
        setItems(out);
        void drafts;
      } catch (e) {
        setError(errorText(e));
      }
      await loadRedirects();
    })();
  }, []);

  const visible = useMemo(
    () => items.filter((i) => !onlyIssues || i.issues.length > 0),
    [items, onlyIssues],
  );
  if (!s)
    return error ? (
      <Message kind="error">{error}</Message>
    ) : (
      <p className="text-muted-foreground">Loading…</p>
    );
  const seo = (patch: Partial<SiteSettings["seo"]>) => setS({ ...s, seo: { ...s.seo, ...patch } });
  const analytics = (patch: Partial<SiteSettings["analytics"]>) =>
    setS({ ...s, analytics: { ...s.analytics, ...patch } });

  const saveSettings = async () => {
    setError("");
    setNotice("");
    const ga = s.analytics.gaMeasurementId;
    if (ga && !/^G-[A-Z0-9]+$/.test(ga))
      return setError("The Google Analytics ID should look like G-XXXXXXXXXX.");
    const { error: err } = await supabase!
      .from("site_settings")
      .upsert({ key: "seo", value: settingsToRows(s).seo });
    if (err) return setError(errorText(err));
    clearDataCache();
    return setNotice("Saved. The live site updates within about a minute.");
  };
  const addRedirect = async () => {
    setError("");
    setNotice("");
    const f = from.trim().replace(/\/$/, "");
    const t = to.trim();
    if (!/^\/[^/]/.test(f)) return setError('The old address must start with "/", like /old-page.');
    if (!/^(\/|https:\/\/)/.test(t))
      return setError('The new address must start with "/" or "https://".');
    if (f === t) return setError("The old and new addresses are the same.");
    const { error: err } = await supabase!
      .from("redirects")
      .insert({ from_path: f, to_path: t, code });
    if (err) return setError(errorText(err));
    setFrom("");
    setTo("");
    clearDataCache();
    setNotice("Redirect added.");
    return loadRedirects();
  };

  return (
    <>
      <Title>SEO</Title>
      <div className="space-y-5">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <section className="border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl text-primary">
              Recommendations ({items.filter((i) => i.issues.length).length} of {items.length} need
              attention)
            </h2>
            <Check
              label="Only show items with issues"
              checked={onlyIssues}
              onChange={setOnlyIssues}
            />
          </div>
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {visible.map((i) => (
                  <tr key={`${i.kind}-${i.path}`} className="border-t border-border">
                    <td className="p-2 text-xs text-muted-foreground">{i.kind}</td>
                    <td className="p-2">
                      {i.name}
                      <span className="block font-mono text-xs text-muted-foreground">
                        {i.path}
                      </span>
                    </td>
                    <td className="p-2 text-xs">
                      {i.issues.length ? (
                        <span className="text-destructive">{i.issues.join(" · ")}</span>
                      ) : (
                        "OK"
                      )}
                    </td>
                    <td className="p-2">
                      <Link
                        to={i.edit.to}
                        {...(i.edit.params ? { params: i.edit.params } : {})}
                        className={btnOutline}
                      >
                        Fix
                      </Link>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground">No issues found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 border border-border bg-card p-4">
          <h2 className="text-xl text-primary">Redirects</h2>
          {canEdit && (
            <div className="grid items-end gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
              <Field label="Old address" value={from} onChange={setFrom} />
              <Field label="New address" value={to} onChange={setTo} />
              <label className="block text-sm">
                Type
                <select
                  value={code}
                  onChange={(e) => setCode(Number(e.target.value))}
                  className={input}
                >
                  <option value={301}>Permanent (301)</option>
                  <option value={302}>Temporary (302)</option>
                </select>
              </label>
              <button type="button" onClick={() => void addRedirect()} className={btn}>
                Add
              </button>
            </div>
          )}
          <ul className="divide-y divide-border text-sm">
            {redirects.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="break-all font-mono text-xs">
                  {r.from_path} → {r.to_path} ({r.code})
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      void supabase!
                        .from("redirects")
                        .delete()
                        .eq("id", r.id)
                        .then(({ error: err }) => {
                          if (err) setError(errorText(err));
                          clearDataCache();
                          void loadRedirects();
                        })
                    }
                    className={btnDanger}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
            {redirects.length === 0 && (
              <li className="py-2 text-muted-foreground">No redirects yet.</li>
            )}
          </ul>
        </section>

        {canEdit && (
          <section className="space-y-3 border border-border bg-card p-4">
            <h2 className="text-xl text-primary">Search engine settings</h2>
            <Field
              label="Google Analytics measurement ID"
              value={s.analytics.gaMeasurementId}
              onChange={(v) => analytics({ gaMeasurementId: v.trim() })}
            />
            <Field
              label="Google Search Console verification code"
              value={s.analytics.searchConsoleVerification}
              onChange={(v) => analytics({ searchConsoleVerification: v.trim() })}
            />
            <MediaField
              label="Default social sharing image"
              value={s.seo.defaultOgImage}
              onChange={(v) => seo({ defaultOgImage: v })}
              folder="branding"
            />
            <Area
              label="robots.txt"
              rows={5}
              value={s.seo.robotsTxt}
              onChange={(v) => seo({ robotsTxt: v })}
              hint="The sitemap line is added automatically."
            />
            <div className="flex flex-wrap gap-5">
              <Check
                label="Organization schema"
                checked={s.seo.schemaOrganization}
                onChange={(v) => seo({ schemaOrganization: v })}
              />
              <Check
                label="Product schema"
                checked={s.seo.schemaProduct}
                onChange={(v) => seo({ schemaProduct: v })}
              />
              <Check
                label="Breadcrumb schema"
                checked={s.seo.schemaBreadcrumbs}
                onChange={(v) => seo({ schemaBreadcrumbs: v })}
              />
              <Check
                label="Include products in sitemap"
                checked={s.seo.sitemapProducts}
                onChange={(v) => seo({ sitemapProducts: v })}
              />
            </div>
            <button type="button" onClick={() => void saveSettings()} className={btn}>
              Save SEO settings
            </button>
          </section>
        )}
      </div>
    </>
  );
}
