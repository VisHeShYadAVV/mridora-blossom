import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import { ProductCard } from "@/components/site/ProductCard";
import {
  getCollection,
  productsByCollection,
  type CollectionId,
  type ProductRecord,
} from "@/data/catalog";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }) => {
    const collection = getCollection(params.slug);
    if (!collection) throw notFound();
    return { collection, products: productsByCollection(collection.id as CollectionId) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Collection not found — MRIDORA GLOBAL" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.collection.name} Ceramics — MRIDORA GLOBAL`;
    const description = loaderData.collection.shortDescription;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: CollectionNotFound,
  component: CollectionDetail,
});

function CollectionNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-40 pb-24 text-center">
      <h1 className="text-3xl">Collection not found</h1>
      <p className="mt-4 text-muted-foreground">
        This collection is not available. Browse the full range instead.
      </p>
      <Link to="/collections" className="btn btn-primary mt-8">
        All Collections
      </Link>
    </div>
  );
}

function CollectionDetail() {
  const { collection, products } = Route.useLoaderData();

  return (
    <>
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20">
        <img
          src={collection.image}
          alt={collection.imageAlt}
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-10">
          <nav className="text-xs uppercase tracking-[0.18em] text-navy-foreground/60">
            <Link to="/collections" className="hover:text-navy-foreground">
              Collections
            </Link>
            <span> / {collection.name}</span>
          </nav>
          <h1 className="mt-6 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            {collection.name}
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/80">{collection.description}</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
            {products.length} Products
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product: ProductRecord) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={`Request quotations from the ${collection.name} range.`}
        body="Add the products you need to your inquiry list, then submit a single request with quantities and destination market."
      />
    </>
  );
}
