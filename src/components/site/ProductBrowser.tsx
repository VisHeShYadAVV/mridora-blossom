import { useMemo, useState } from "react";

import { ProductCard } from "@/components/site/ProductCard";
import { track } from "@/lib/analytics";
import type { Collection, Product, Subcategory } from "@/lib/types";

const CAPACITY = [
  { label: "Up to 250 ml", test: (v: number) => v <= 250 },
  { label: "251 – 500 ml", test: (v: number) => v > 250 && v <= 500 },
  { label: "501 ml – 1 L", test: (v: number) => v > 500 && v <= 1000 },
  { label: "Over 1 L", test: (v: number) => v > 1000 },
];
const SIZE = [
  { label: "Up to 15 cm", test: (v: number) => v <= 15 },
  { label: "15 – 30 cm", test: (v: number) => v > 15 && v <= 30 },
  { label: "Over 30 cm", test: (v: number) => v > 30 },
];

const uniq = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
const fieldClass = "mt-1.5 w-full border border-input bg-card px-3 py-2.5 text-sm";

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-xs tracking-wide text-muted-foreground">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const asOptions = (values: string[]) => values.map((value) => ({ value, label: value }));

export function ProductBrowser({
  products,
  collections,
  subcategories,
  fixedCollection,
  fixedSubcategory,
  initialQuery = "",
}: {
  products: Product[];
  collections: Collection[];
  subcategories: Subcategory[];
  fixedCollection?: string;
  fixedSubcategory?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [collection, setCollection] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [material, setMaterial] = useState("");
  const [colour, setColour] = useState("");
  const [finish, setFinish] = useState("");
  const [capacity, setCapacity] = useState("");
  const [size, setSize] = useState("");
  const [custom, setCustom] = useState("");

  const activeCollection = fixedCollection ?? collection;
  const subOptions = subcategories.filter(
    (s) => !activeCollection || s.collectionCode === activeCollection,
  );
  const collectionOf = (p: Product) => p.subcategoryId.split("-")[0] ?? "";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = CAPACITY.find((c) => c.label === capacity);
    const dim = SIZE.find((c) => c.label === size);
    return products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) &&
        (!activeCollection || collectionOf(p) === activeCollection) &&
        ((fixedSubcategory ?? subcategory) === "" ||
          p.subcategoryId === (fixedSubcategory ?? subcategory)) &&
        (!material || p.material === material) &&
        (!colour || p.colours.includes(colour)) &&
        (!finish || p.finish === finish) &&
        (!cap || (p.capacityMl !== null && cap.test(p.capacityMl))) &&
        (!dim || (p.maxDimensionCm !== null && dim.test(p.maxDimensionCm))) &&
        (!custom || p.customizable === (custom === "yes")),
    );
  }, [
    products,
    query,
    activeCollection,
    fixedSubcategory,
    subcategory,
    material,
    colour,
    finish,
    capacity,
    size,
    custom,
  ]);

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <aside className="space-y-4" aria-label="Product filters">
        <label className="block text-xs tracking-wide text-muted-foreground">
          Search name or SKU
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={(e) => {
              if (e.target.value.trim()) track("search", e.target.value.trim());
            }}
            placeholder="e.g. MRD-TW-DP-0001"
            className={fieldClass}
          />
        </label>
        {!fixedCollection && (
          <Select
            label="Collection"
            value={collection}
            onChange={(v) => {
              setCollection(v);
              setSubcategory("");
            }}
            options={collections.map((c) => ({ value: c.code, label: c.name }))}
          />
        )}
        {!fixedSubcategory && (
          <Select
            label="Subcategory"
            value={subcategory}
            onChange={setSubcategory}
            options={subOptions.map((s) => ({ value: s.id, label: s.name }))}
          />
        )}
        <Select
          label="Material"
          value={material}
          onChange={setMaterial}
          options={asOptions(uniq(products.map((p) => p.material)))}
        />
        <Select
          label="Colour"
          value={colour}
          onChange={setColour}
          options={asOptions(uniq(products.flatMap((p) => p.colours)))}
        />
        <Select
          label="Finish"
          value={finish}
          onChange={setFinish}
          options={asOptions(uniq(products.map((p) => p.finish)))}
        />
        <Select
          label="Capacity"
          value={capacity}
          onChange={setCapacity}
          options={asOptions(CAPACITY.map((c) => c.label))}
        />
        <Select
          label="Dimensions"
          value={size}
          onChange={setSize}
          options={asOptions(SIZE.map((c) => c.label))}
        />
        <Select
          label="Customization"
          value={custom}
          onChange={setCustom}
          options={[
            { value: "yes", label: "Available" },
            { value: "no", label: "On request / not listed" },
          ]}
        />
      </aside>
      <div>
        <p className="text-sm text-muted-foreground" role="status">
          {visible.length} {visible.length === 1 ? "product" : "products"}
        </p>
        {visible.length === 0 ? (
          <p className="mt-6 border border-border bg-card p-8 text-muted-foreground">
            No listed products match these filters. Products with unconfirmed capacity or dimensions
            do not appear under those filters. Contact the export desk for current availability.
          </p>
        ) : (
          <div className="product-grid mt-6">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
