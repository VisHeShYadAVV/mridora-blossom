import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Area,
  btn,
  btnDanger,
  btnOutline,
  Check,
  errorText,
  Field,
  Message,
  Title,
} from "@/components/admin/ui";
import { MediaField } from "@/components/admin/media";
import { slugify } from "@/data/catalog";
import {
  clearDataCache,
  collectionFromRow,
  collectionToRow,
  subcategoryFromRow,
  subcategoryToRow,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";
import type { Collection, Subcategory } from "@/lib/types";

export const Route = createFileRoute("/admin/collections")({ component: Page });

const CODE = /^[A-Z]{2}$/;

function Page() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [open, setOpen] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [c, s] = await Promise.all([
      supabase!.from("collections").select("*").order("sort_order"),
      supabase!.from("subcategories").select("*").order("sort_order"),
    ]);
    if (c.error ?? s.error) return setError(errorText(c.error ?? s.error));
    setCollections((c.data ?? []).map(collectionFromRow));
    return setSubs((s.data ?? []).map(subcategoryFromRow));
  };
  useEffect(() => void load(), []);

  const act = async (fn: () => PromiseLike<{ error: unknown }>, done: string) => {
    setError("");
    setNotice("");
    const { error: err } = await fn();
    if (err) return setError(errorText(err));
    clearDataCache();
    setNotice(done);
    return load();
  };

  const updateC = (c: Collection) =>
    setCollections((cur) => cur.map((x) => (x.code === c.code ? c : x)));
  const updateS = (s: Subcategory) => setSubs((cur) => cur.map((x) => (x.id === s.id ? s : x)));

  const addCollection = () => {
    const code = window
      .prompt("Two-letter SKU code for the new collection, e.g. GW")
      ?.trim()
      .toUpperCase();
    if (!code) return;
    if (!CODE.test(code)) return setError("The code must be exactly two letters.");
    const name = window.prompt("Collection name")?.trim();
    if (!name) return;
    const c: Collection = {
      code,
      slug: slugify(name),
      name,
      tagline: "",
      description: "",
      seoTitle: `${name} | MRIDORA`,
      seoDescription: "",
      image: "",
      sortOrder: collections.length,
      published: false,
    };
    void act(
      () => supabase!.from("collections").insert(collectionToRow(c)),
      `Added ${name} as unpublished.`,
    );
  };

  const addSub = (c: Collection) => {
    const code = window
      .prompt("Two-letter SKU code for the subcategory, e.g. DP")
      ?.trim()
      .toUpperCase();
    if (!code) return;
    if (!CODE.test(code)) return setError("The code must be exactly two letters.");
    const name = window.prompt("Subcategory name")?.trim();
    if (!name) return;
    const s: Subcategory = {
      id: `${c.code}-${code}`,
      collectionCode: c.code,
      code,
      slug: slugify(name),
      name,
      description: "",
      seoTitle: `${name} | ${c.name} | MRIDORA`,
      seoDescription: "",
      sortOrder: subs.length,
      published: false,
    };
    void act(
      () => supabase!.from("subcategories").insert(subcategoryToRow(s)),
      `Added ${name} as unpublished.`,
    );
  };

  return (
    <>
      <Title
        actions={
          <button onClick={addCollection} className={btn}>
            Add collection
          </button>
        }
      >
        Collections
      </Title>
      <div className="space-y-4">
        <Message kind="error">{error}</Message>
        <Message kind="ok">{notice}</Message>
        {collections.map((c) => (
          <section key={c.code} className="border border-border bg-card">
            <button
              onClick={() => setOpen(open === c.code ? "" : c.code)}
              aria-expanded={open === c.code}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="font-display text-xl text-primary">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.code} · {subs.filter((s) => s.collectionCode === c.code).length} subcategories
                {c.published ? "" : " · unpublished"}
              </span>
            </button>
            {open === c.code && (
              <div className="space-y-4 border-t border-border p-4">
                <Field label="Name" value={c.name} onChange={(v) => updateC({ ...c, name: v })} />
                <Field
                  label="URL slug"
                  value={c.slug}
                  onChange={(v) => updateC({ ...c, slug: slugify(v) })}
                  hint="Changing this changes the page address."
                />
                <Field
                  label="Tagline"
                  value={c.tagline}
                  onChange={(v) => updateC({ ...c, tagline: v })}
                />
                <Area
                  label="Description"
                  value={c.description}
                  onChange={(v) => updateC({ ...c, description: v })}
                />
                <Field
                  label="SEO title"
                  value={c.seoTitle}
                  onChange={(v) => updateC({ ...c, seoTitle: v })}
                />
                <Area
                  label="SEO description"
                  value={c.seoDescription}
                  onChange={(v) => updateC({ ...c, seoDescription: v })}
                />
                <MediaField
                  label="Collection image"
                  value={c.image}
                  onChange={(v) => updateC({ ...c, image: v })}
                  folder="collections"
                />
                <Field
                  label="Display order"
                  type="number"
                  value={String(c.sortOrder)}
                  onChange={(v) => updateC({ ...c, sortOrder: Number(v) || 0 })}
                />
                <Check
                  label="Published"
                  checked={c.published}
                  onChange={(v) => updateC({ ...c, published: v })}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      void act(
                        () =>
                          supabase!
                            .from("collections")
                            .update(collectionToRow(c))
                            .eq("code", c.code),
                        `Saved ${c.name}.`,
                      )
                    }
                    className={btn}
                  >
                    Save collection
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${c.name}?`))
                        void act(
                          () => supabase!.from("collections").delete().eq("code", c.code),
                          `Deleted ${c.name}.`,
                        );
                    }}
                    className={btnDanger}
                  >
                    Delete
                  </button>
                </div>
                <h3 className="pt-4 text-xl text-primary">Subcategories</h3>
                {subs
                  .filter((s) => s.collectionCode === c.code)
                  .map((s) => (
                    <details key={s.id} className="border border-border p-3">
                      <summary className="cursor-pointer text-sm">
                        {s.name}{" "}
                        <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                        {!s.published && " · unpublished"}
                      </summary>
                      <div className="mt-3 space-y-3">
                        <Field
                          label="Name"
                          value={s.name}
                          onChange={(v) => updateS({ ...s, name: v })}
                        />
                        <Field
                          label="URL slug"
                          value={s.slug}
                          onChange={(v) => updateS({ ...s, slug: slugify(v) })}
                        />
                        <Area
                          label="Description"
                          value={s.description}
                          onChange={(v) => updateS({ ...s, description: v })}
                        />
                        <Field
                          label="SEO title"
                          value={s.seoTitle}
                          onChange={(v) => updateS({ ...s, seoTitle: v })}
                        />
                        <Area
                          label="SEO description"
                          value={s.seoDescription}
                          onChange={(v) => updateS({ ...s, seoDescription: v })}
                        />
                        <Field
                          label="Display order"
                          type="number"
                          value={String(s.sortOrder)}
                          onChange={(v) => updateS({ ...s, sortOrder: Number(v) || 0 })}
                        />
                        <Check
                          label="Published"
                          checked={s.published}
                          onChange={(v) => updateS({ ...s, published: v })}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              void act(
                                () =>
                                  supabase!
                                    .from("subcategories")
                                    .update(subcategoryToRow(s))
                                    .eq("id", s.id),
                                `Saved ${s.name}.`,
                              )
                            }
                            className={btn}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete ${s.name}?`))
                                void act(
                                  () => supabase!.from("subcategories").delete().eq("id", s.id),
                                  `Deleted ${s.name}.`,
                                );
                            }}
                            className={btnDanger}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </details>
                  ))}
                <button onClick={() => addSub(c)} className={btnOutline}>
                  Add subcategory
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
