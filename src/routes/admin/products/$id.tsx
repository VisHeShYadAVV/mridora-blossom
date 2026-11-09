import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Area,
  btn,
  btnOutline,
  Check,
  errorText,
  Field,
  input,
  Message,
  Title,
  useAdmin,
} from "@/components/admin/ui";
import { slugify } from "@/data/catalog";
import { History } from "@/components/admin/History";
import { ImageCropper, MediaField, MediaPicker } from "@/components/admin/media";
import { SeoPreview } from "@/components/admin/SeoPreview";
import { blankProduct } from "@/lib/admin-products";
import { uploadAsset } from "@/lib/media";
import { absoluteUrl } from "@/lib/seo";
import { useSite } from "@/lib/use-site";
import { clearDataCache, productFromRow, productToRow, subcategoryFromRow } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { SPEC_FIELDS, type Product, type ProductStatus, type Subcategory } from "@/lib/types";

export const Route = createFileRoute("/admin/products/$id")({ component: Editor });

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [p, setP] = useState<Product | null>(null);
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [saveCount, setSaveCount] = useState(0);
  const { settings } = useSite();
  const { can } = useAdmin();
  const canPublish = can("catalogue", "publish");

  useEffect(() => {
    void (async () => {
      try {
        const s = await supabase!.from("subcategories").select("*").order("id");
        if (s.error) throw s.error;
        const list = (s.data ?? []).map(subcategoryFromRow);
        setSubs(list);
        if (isNew) return setP(blankProduct(list[0]?.id ?? ""));
        const r = await supabase!.from("products").select("*").eq("id", id).maybeSingle();
        if (r.error) throw r.error;
        if (!r.data) return setError("Product not found.");
        return setP(productFromRow(r.data));
      } catch (e) {
        return setError(errorText(e));
      }
    })();
  }, [id, isNew]);

  if (!p)
    return error ? (
      <Message kind="error">{error}</Message>
    ) : (
      <p className="text-muted-foreground">Loading…</p>
    );

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setP({ ...p, [key]: value });
  // The filter attributes and the spec table show the same facts, so they are edited as one.
  const setMaterial = (v: string) =>
    setP({ ...p, material: v, specs: { ...p.specs, material: v } });
  const setFinish = (v: string) => setP({ ...p, finish: v, specs: { ...p.specs, finish: v } });
  const setColours = (v: string) => {
    const colours = v
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setP({ ...p, colours, specs: { ...p.specs, colours: v } });
  };

  const save = async () => {
    setError("");
    setNotice("");
    if (!p.name.trim()) return setError("Product name is required.");
    if (!p.subcategoryId) return setError("Choose a subcategory.");
    setBusy(true);
    try {
      if (isNew) {
        const { data: sku, error: err } = await supabase!.rpc("next_sku", {
          sub_id: p.subcategoryId,
        });
        if (err) throw err;
        const row = productToRow({ ...p, sku, slug: p.slug || slugify(`${p.name} ${sku}`) });
        const { data, error: e2 } = await supabase!
          .from("products")
          .insert(row)
          .select("id")
          .single();
        if (e2) throw e2;
        clearDataCache();
        await navigate({ to: "/admin/products/$id", params: { id: data.id as string } });
      } else {
        const { error: err } = await supabase!
          .from("products")
          .update(productToRow(p))
          .eq("id", p.id);
        if (err) throw err;
        clearDataCache();
        setSaveCount((n) => n + 1);
        setNotice("Saved. The live site updates within about a minute.");
      }
    } catch (e) {
      setError(errorText(e));
    }
    return setBusy(false);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      const images = [...p.images];
      const alts = [...p.imageAlts];
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
        const asset = await uploadAsset(file, "products", p.sku ? [p.sku] : []);
        images.push(asset.url);
        alts.push(p.name);
      }
      setP({ ...p, images, imageAlts: alts });
      setNotice("Image uploaded. Save the product to keep it.");
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    const images = [...p.images];
    const alts = [...p.imageAlts];
    const [a, b] = [images[i]!, images[j]!];
    images[i] = b;
    images[j] = a;
    const [x, y] = [alts[i] ?? "", alts[j] ?? ""];
    alts[i] = y;
    alts[j] = x;
    setP({ ...p, images, imageAlts: alts });
  };

  const removeImage = (i: number) =>
    setP({
      ...p,
      images: p.images.filter((_, k) => k !== i),
      imageAlts: p.imageAlts.filter((_, k) => k !== i),
    });
  const setAlt = (i: number, v: string) => {
    const alts = [...p.imageAlts];
    alts[i] = v;
    setP({ ...p, imageAlts: alts });
  };
  const addImage = (url: string, alt: string) => {
    if (p.images.includes(url)) return;
    setP({ ...p, images: [...p.images, url], imageAlts: [...p.imageAlts, alt || p.name] });
  };
  const replaceImage = (i: number, url: string) =>
    setP({ ...p, images: p.images.map((src, k) => (k === i ? url : src)) });
  const applyTemplate = (name: string) => {
    const template = settings.catalogue.templates.find((t) => t.name === name);
    if (!template) return;
    const existing = new Set(p.customSpecs.map((c) => c.label));
    set("customSpecs", [
      ...p.customSpecs,
      ...template.fields.filter((f) => !existing.has(f)).map((label) => ({ label, value: "" })),
    ]);
  };
  const setCustom = (i: number, patch: Partial<Product["customSpecs"][number]>) =>
    set(
      "customSpecs",
      p.customSpecs.map((c, k) => (k === i ? { ...c, ...patch } : c)),
    );
  const restore = (row: Record<string, unknown>) => {
    setP({ ...productFromRow(row), id: p.id });
    setNotice("Version loaded into the editor. Save to keep it.");
  };
  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };
  const section = "space-y-4 border border-border bg-card p-5";
  const linked = new Set(["material", "finish", "colours"]);

  return (
    <>
      <Title
        actions={
          <>
            <Link to="/admin/products" className={btnOutline}>
              Back
            </Link>
            <button disabled={busy} onClick={() => void save()} className={btn}>
              {busy ? "Working…" : "Save"}
            </button>
          </>
        }
      >
        {isNew ? "New product" : p.sku}
      </Title>
      <div className="space-y-5">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        <section className={section}>
          <Field label="Product name" value={p.name} onChange={(v) => set("name", v)} />
          <Field
            label="SKU"
            value={p.sku}
            onChange={() => {}}
            disabled
            hint={isNew ? "Generated automatically when you first save." : "SKUs are permanent."}
          />
          <Field
            label="URL slug"
            value={p.slug}
            onChange={(v) => set("slug", slugify(v))}
            hint={
              isNew
                ? "Leave empty to generate from the name."
                : "Changing this changes the page address."
            }
          />
          <label className="block text-sm">
            Subcategory
            <select
              value={p.subcategoryId}
              onChange={(e) => set("subcategoryId", e.target.value)}
              className={input}
            >
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Status
            <select
              value={p.status}
              onChange={(e) => set("status", e.target.value as ProductStatus)}
              className={input}
            >
              <option value="draft">Draft (hidden)</option>
              <option value="active">Active (live)</option>
              <option value="archived">Archived (hidden)</option>
            </select>
          </label>
          {canPublish && p.status !== "active" && (
            <label className="block text-sm">
              Publish automatically at (optional)
              <input
                type="datetime-local"
                value={toLocalInput(p.publishAt)}
                onChange={(e) =>
                  set("publishAt", e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className={input}
              />
            </label>
          )}
          <Field
            label="Display order"
            type="number"
            value={String(p.sortOrder)}
            onChange={(v) => set("sortOrder", Number(v) || 0)}
          />
          <div className="flex flex-wrap gap-5">
            <Check label="Featured" checked={p.featured} onChange={(v) => set("featured", v)} />
            <Check
              label="New arrival"
              checked={p.newArrival}
              onChange={(v) => set("newArrival", v)}
            />
            <Check
              label="Customization available"
              checked={p.customizable}
              onChange={(v) => set("customizable", v)}
            />
            <Check
              label="Sample listing (shows a warning, hidden from search engines)"
              checked={p.isSample}
              onChange={(v) => set("isSample", v)}
            />
          </div>
          <Area label="Overview" rows={4} value={p.overview} onChange={(v) => set("overview", v)} />
        </section>

        <section className={section}>
          <h2 className="text-xl text-primary">Photographs</h2>
          {can("media", "read") && (
            <button type="button" onClick={() => setPicker(true)} className={btnOutline}>
              Add from media library
            </button>
          )}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            aria-label="Upload photographs"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files);
              e.target.value = "";
            }}
            className={input}
          />
          {p.images.map((src, i) => (
            <div
              key={src}
              className="flex flex-wrap items-center gap-3 border-t border-border pt-3"
            >
              <img src={src} alt="" className="h-20 w-20 object-cover" />
              <div className="min-w-48 flex-1">
                <Field
                  label={i === 0 ? "Alt text (main image)" : "Alt text"}
                  value={p.imageAlts[i] ?? ""}
                  onChange={(v) => setAlt(i, v)}
                />
              </div>
              <button disabled={i === 0} onClick={() => moveImage(i, -1)} className={btnOutline}>
                Up
              </button>
              <button
                disabled={i === p.images.length - 1}
                onClick={() => moveImage(i, 1)}
                className={btnOutline}
              >
                Down
              </button>
              <button onClick={() => setCropIndex(i)} className={btnOutline}>
                Crop
              </button>
              <button onClick={() => removeImage(i)} className={btnOutline}>
                Remove
              </button>
            </div>
          ))}
        </section>

        <section className={section}>
          <h2 className="text-xl text-primary">Technical specifications</h2>
          <p className="text-xs text-muted-foreground">
            Enter verified values only. Leave “Available on Request” or “To Be Confirmed” where data
            is missing.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Material"
              value={p.material}
              onChange={setMaterial}
              list="material-options"
            />
            <Field
              label="Surface finish"
              value={p.finish}
              onChange={setFinish}
              list="finish-options"
            />
            <datalist id="material-options">
              {settings.catalogue.materials.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <datalist id="finish-options">
              {settings.catalogue.finishes.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <Field
              label="Available colours (comma separated)"
              value={p.specs.colours ?? ""}
              onChange={setColours}
            />
            {SPEC_FIELDS.filter(([k]) => !linked.has(k)).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={p.specs[key] ?? ""}
                onChange={(v) => set("specs", { ...p.specs, [key]: v })}
              />
            ))}
            <Field
              label="Capacity for filters (ml)"
              type="number"
              value={p.capacityMl?.toString() ?? ""}
              onChange={(v) => set("capacityMl", v === "" ? null : Number(v))}
            />
            <Field
              label="Largest dimension for filters (cm)"
              type="number"
              value={p.maxDimensionCm?.toString() ?? ""}
              onChange={(v) => set("maxDimensionCm", v === "" ? null : Number(v))}
            />
          </div>
          <Area
            label="Customization information"
            value={p.customizationInfo}
            onChange={(v) => set("customizationInfo", v)}
          />
          <Area
            label="Packaging information"
            value={p.packagingInfo}
            onChange={(v) => set("packagingInfo", v)}
          />
          <MediaField
            label="Specification sheet (PDF)"
            value={p.specSheetUrl}
            onChange={(v) => set("specSheetUrl", v)}
            kind="pdf"
            folder="specifications"
          />
          <h3 className="pt-2 text-lg text-primary">Additional specification rows</h3>
          {settings.catalogue.templates.length > 0 && (
            <select
              aria-label="Apply specification template"
              value=""
              onChange={(e) => applyTemplate(e.target.value)}
              className={input}
            >
              <option value="">Apply a template…</option>
              {settings.catalogue.templates.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
          )}
          {p.customSpecs.map((c, i) => (
            <div key={i} className="grid items-end gap-2 md:grid-cols-[1fr_1fr_auto]">
              <Field label="Label" value={c.label} onChange={(v) => setCustom(i, { label: v })} />
              <Field label="Value" value={c.value} onChange={(v) => setCustom(i, { value: v })} />
              <button
                type="button"
                onClick={() =>
                  set(
                    "customSpecs",
                    p.customSpecs.filter((_, k) => k !== i),
                  )
                }
                className={btnOutline}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("customSpecs", [...p.customSpecs, { label: "", value: "" }])}
            className={btnOutline}
          >
            Add row
          </button>
          <Field
            label="Related SKUs (comma separated)"
            value={p.relatedSkus.join(", ")}
            onChange={(v) =>
              set(
                "relatedSkus",
                v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </section>

        <section className={section}>
          <h2 className="text-xl text-primary">SEO</h2>
          <Field
            label="Page title"
            value={p.seoTitle}
            onChange={(v) => set("seoTitle", v)}
            hint="Leave empty to generate from the product name."
          />
          <Area
            label="Meta description"
            value={p.seoDescription}
            onChange={(v) => set("seoDescription", v)}
            hint="Leave empty to generate automatically."
          />
          <Field
            label="Canonical address (optional)"
            value={p.canonical}
            onChange={(v) => set("canonical", v)}
          />
          <SeoPreview
            title={p.seoTitle || `${p.name} (${p.sku || "SKU"}) | MRIDORA`}
            description={p.seoDescription || p.overview}
            url={absoluteUrl(`/products/${p.slug || "new-product"}`)}
            image={p.images[0] ?? settings.seo.defaultOgImage}
          />
        </section>
        {!isNew && (
          <History entity="products" id={p.sku} onRestore={restore} refreshKey={saveCount} />
        )}
      </div>
      {picker && (
        <MediaPicker
          kind="image"
          folder="products"
          onClose={() => setPicker(false)}
          onPick={(url, asset) => {
            addImage(url, asset.alt);
            setPicker(false);
          }}
        />
      )}
      {cropIndex !== null && p.images[cropIndex] && (
        <ImageCropper
          url={p.images[cropIndex]}
          name={p.sku || "product"}
          folder="products"
          onClose={() => setCropIndex(null)}
          onDone={(asset) => {
            replaceImage(cropIndex, asset.url);
            setCropIndex(null);
            setNotice("Cropped image added. Save the product to keep it.");
          }}
        />
      )}
    </>
  );
}
