import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { CtaBand } from "@/components/site/CtaBand";
import { ProductCard } from "@/components/site/ProductCard";
import {
  CATEGORIES,
  COLLECTIONS,
  PRODUCTS,
  searchProducts,
  type CategoryId,
  type CollectionId,
} from "@/data/catalog";

const title = "Ceramic Product Catalogue — MRIDORA GLOBAL";
const description =
  "Search and filter the MRIDORA GLOBAL ceramic export catalogue by collection and category. Tableware, hotelware, decorative ceramics and OEM-ready products with SKU references.";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ProductsIndex,
});

function ProductsIndex() {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<CollectionId | "all">("all");
  const [category, setCategory] = useState<CategoryId | "all">("all");

  const results = useMemo(() => {
    let list = PRODUCTS;
    if (collection !== "all") list = list.filter((p) => p.collection === collection);
    if (category !== "all") list = list.filter((p) => p.category === category);
    return searchProducts(query, list);
  }, [query, collection, category]);

  return (
    <>
      <section className="bg-navy pt-32 pb-14 lg:pt-40 lg:pb-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Catalogue</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            Ceramic product catalogue
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            {PRODUCTS.length} referenced products across tableware, hotelware and decorative
            ceramics. Pricing is quoted per enquiry — no public price list.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-sand py-6">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-3 lg:px-10">
          <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="SKU, product name, colour…"
              className="field"
              type="search"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Collection
            <select
              value={collection}
              onChange={(event) => setCollection(event.target.value as CollectionId | "all")}
              className="field"
            >
              <option value="all">All collections</option>
              {COLLECTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryId | "all")}
              className="field"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-sm text-muted-foreground">
            {results.length} product{results.length === 1 ? "" : "s"}
          </p>

          {results.length === 0 ? (
            <div className="mt-10 border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">
                No products match this search. Clear the filters or send us your requirement
                directly.
              </p>
              <Link to="/request-quote" className="btn btn-primary mt-6">
                Request a Quote
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.sku} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Build one inquiry for multiple SKUs."
        body="Add every product you want quoted to your inquiry list, add target quantities, and submit a single request. Our export desk replies with feasibility and pricing."
      />
    </>
  );
}
