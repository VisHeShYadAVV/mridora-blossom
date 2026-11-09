import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  useAdmin,
  btn,
  btnDanger,
  btnOutline,
  errorText,
  input,
  Message,
  Title,
} from "@/components/admin/ui";
import { slugify, ON_REQUEST } from "@/data/catalog";
import { downloadCsv, parseCsv, toCsv } from "@/lib/csv";
import { readXlsxRows, writeXlsx } from "@/lib/excel";
import { clearDataCache, productToRow, subcategoryFromRow } from "@/lib/data";
import { blankProduct, loadAllProducts } from "@/lib/admin-products";
import { supabase } from "@/lib/supabase";
import { SPEC_FIELDS, type Product, type ProductStatus, type Subcategory } from "@/lib/types";

export const Route = createFileRoute("/admin/products/")({ component: Products });

const BASE = [
  "sku",
  "name",
  "subcategory_id",
  "status",
  "overview",
  "material",
  "finish",
  "colours",
  "customizable",
  "capacity_ml",
  "max_dimension_cm",
];
const SPEC_KEYS = SPEC_FIELDS.map(([k]) => k).filter(
  (k) => !["material", "finish", "colours"].includes(k),
);
const STATUSES: ProductStatus[] = ["active", "draft", "archived"];
const num = (v: string | undefined) => (v && Number.isFinite(Number(v)) ? Number(v) : null);

function Products() {
  const { can } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sub, setSub] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMove, setBulkMove] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [p, s] = await Promise.all([
        loadAllProducts(),
        supabase!.from("subcategories").select("*").order("id"),
      ]);
      if (s.error) throw s.error;
      setProducts(p);
      setSubs((s.data ?? []).map(subcategoryFromRow));
    } catch (e) {
      setError(errorText(e));
    }
    setLoading(false);
  };
  useEffect(() => void load(), []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        (!status || p.status === status) &&
        (!sub || p.subcategoryId === sub),
    );
  }, [products, query, status, sub]);

  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setNotice(await fn());
      clearDataCache();
      setSelected(new Set());
      await load();
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  const duplicate = (p: Product) =>
    run(async () => {
      const { data: sku, error: err } = await supabase!.rpc("next_sku", {
        sub_id: p.subcategoryId,
      });
      if (err) throw err;
      const copy: Product = {
        ...p,
        sku,
        name: `${p.name} (copy)`,
        slug: slugify(`${p.name} copy ${sku}`),
        status: "draft",
        featured: false,
      };
      const { error: e2 } = await supabase!.from("products").insert(productToRow(copy));
      if (e2) throw e2;
      return `Duplicated as draft ${sku}.`;
    });

  const remove = (p: Product) => {
    if (!window.confirm(`Delete ${p.sku}? Archive it instead if you may need it again.`)) return;
    void run(async () => {
      const { error: err } = await supabase!.from("products").delete().eq("id", p.id);
      if (err) throw err;
      return `Deleted ${p.sku}.`;
    });
  };

  const bulkUpdate = (patch: Record<string, string>, label: string) =>
    run(async () => {
      const { error: err } = await supabase!
        .from("products")
        .update(patch)
        .in("id", [...selected]);
      if (err) throw err;
      return `${label}: ${selected.size} products updated.`;
    });

  const exportTable = () => {
    const headers = [...BASE, ...SPEC_KEYS];
    const rows = products.map((p) => [
      p.sku,
      p.name,
      p.subcategoryId,
      p.status,
      p.overview,
      p.material,
      p.finish,
      p.colours.join("|"),
      p.customizable ? "yes" : "no",
      p.capacityMl?.toString() ?? "",
      p.maxDimensionCm?.toString() ?? "",
      ...SPEC_KEYS.map((k) => p.specs[k] ?? ""),
    ]);
    return { headers, rows };
  };
  const exportCsv = () => {
    const { headers, rows } = exportTable();
    downloadCsv("mridora-products.csv", toCsv(headers, rows));
  };
  const exportExcel = async () => {
    const { headers, rows } = exportTable();
    try {
      await writeXlsx("mridora-products.xlsx", headers, rows);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const importFile = async (file: File) => {
    await run(async () => {
      const rows = /\.xlsx$/i.test(file.name)
        ? await readXlsxRows(file)
        : parseCsv(await file.text());
      const bySku = new Map(products.map((p) => [p.sku, p]));
      const validSubs = new Set(subs.map((s) => s.id));
      const errors: string[] = [];
      const out: Product[] = [];
      for (const [i, r] of rows.entries()) {
        const line = i + 2;
        const existing = r["sku"] ? bySku.get(r["sku"]) : undefined;
        const subcategoryId = r["subcategory_id"] || existing?.subcategoryId || "";
        const name = r["name"] || existing?.name || "";
        if (!name) {
          errors.push(`Line ${line}: name is required`);
          continue;
        }
        if (!validSubs.has(subcategoryId)) {
          errors.push(`Line ${line}: unknown subcategory_id "${subcategoryId}"`);
          continue;
        }
        const rowStatus = (r["status"] || existing?.status || "draft") as ProductStatus;
        if (!STATUSES.includes(rowStatus)) {
          errors.push(`Line ${line}: invalid status "${rowStatus}"`);
          continue;
        }
        let sku = r["sku"] ?? "";
        if (sku && !/^MRD-[A-Z]{2}-[A-Z]{2}-\d{4,}$/.test(sku)) {
          errors.push(`Line ${line}: invalid SKU "${sku}"`);
          continue;
        }
        if (!sku) {
          const { data, error: err } = await supabase!.rpc("next_sku", { sub_id: subcategoryId });
          if (err) throw err;
          sku = data as string;
        }
        const base = existing ?? blankProduct(subcategoryId);
        const specs = { ...base.specs };
        for (const k of SPEC_KEYS) if (r[k]) specs[k] = r[k];
        const material = r["material"] || base.material;
        const finish = r["finish"] || base.finish;
        const colours = r["colours"]
          ? r["colours"]
              .split("|")
              .map((c) => c.trim())
              .filter(Boolean)
          : base.colours;
        specs.material = material;
        specs.finish = finish;
        specs.colours = colours.length ? colours.join(", ") : ON_REQUEST;
        out.push({
          ...base,
          sku,
          name,
          subcategoryId,
          status: rowStatus,
          slug: existing?.slug ?? slugify(`${name} ${sku}`),
          overview: r["overview"] || base.overview,
          material,
          finish,
          colours,
          customizable: r["customizable"]
            ? r["customizable"].toLowerCase() === "yes"
            : base.customizable,
          capacityMl: r["capacity_ml"] ? num(r["capacity_ml"]) : base.capacityMl,
          maxDimensionCm: r["max_dimension_cm"] ? num(r["max_dimension_cm"]) : base.maxDimensionCm,
          specs,
          isSample: existing ? existing.isSample : false,
        });
      }
      // All or nothing: a half-applied spreadsheet is hard to untangle.
      if (errors.length)
        throw new Error(`Nothing was imported. Fix these rows:\n${errors.slice(0, 20).join("\n")}`);
      for (let i = 0; i < out.length; i += 500) {
        const { error: err } = await supabase!
          .from("products")
          .upsert(out.slice(i, i + 500).map(productToRow), { onConflict: "sku" });
        if (err) throw err;
      }
      return `Imported ${out.length} products.`;
    });
  };

  const toggle = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <>
      <Title
        actions={
          <>
            {can("catalogue", "export") && (
              <>
                <button onClick={exportCsv} className={btnOutline}>
                  Export CSV
                </button>
                <button onClick={() => void exportExcel()} className={btnOutline}>
                  Export Excel
                </button>
              </>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={busy} className={btnOutline}>
              Import CSV / Excel
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,text/csv"
              hidden
              aria-label="Import products file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void importFile(f);
              }}
            />
            <Link to="/admin/products/$id" params={{ id: "new" }} className={btn}>
              Add product
            </Link>
          </>
        }
      >
        Products
      </Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            aria-label="Search"
            placeholder="Search name or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={input}
          />
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={input}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Subcategory"
            value={sub}
            onChange={(e) => setSub(e.target.value)}
            className={input}
          >
            <option value="">All subcategories</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.name}
              </option>
            ))}
          </select>
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border border-gold bg-card p-3 text-sm">
            {selected.size} selected:
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => void bulkUpdate({ status: s }, `Set ${s}`)}
                className={btnOutline}
              >
                Set {s}
              </button>
            ))}
            <select
              aria-label="Move to subcategory"
              value={bulkMove}
              onChange={(e) => setBulkMove(e.target.value)}
              className="border border-input bg-card px-2 py-2"
            >
              <option value="">Move to…</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !bulkMove}
              onClick={() => void bulkUpdate({ subcategory_id: bulkMove }, "Moved")}
              className={btnOutline}
            >
              Move
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Moving a product keeps its SKU, so the SKU's codes will still show its original category.
          To import, export first and edit that file; rows without a SKU get a new one.
        </p>
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="p-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="p-3 font-normal">SKU</th>
                <th className="p-3 font-normal">Name</th>
                <th className="p-3 font-normal">Category</th>
                <th className="p-3 font-normal">Status</th>
                <th className="p-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.sku}`}
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap p-3 font-mono text-xs">{p.sku}</td>
                  <td className="p-3">
                    {p.name}
                    {p.isSample && (
                      <span className="ml-2 bg-gold px-1 text-[10px] text-navy-deep">SAMPLE</span>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {subs.find((s) => s.id === p.subcategoryId)?.name}
                  </td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="whitespace-nowrap p-3">
                    <div className="flex gap-2">
                      <Link to="/admin/products/$id" params={{ id: p.id }} className={btnOutline}>
                        Edit
                      </Link>
                      <button
                        disabled={busy}
                        onClick={() => void duplicate(p)}
                        className={btnOutline}
                      >
                        Duplicate
                      </button>
                      <button disabled={busy} onClick={() => remove(p)} className={btnDanger}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
