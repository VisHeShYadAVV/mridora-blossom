import { createFileRoute, Link } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import { COLLECTIONS, productsByCollection } from "@/data/catalog";

const title = "Ceramic Collections — MRIDORA GLOBAL";
const description =
  "Browse MRIDORA GLOBAL ceramic collections: Mughal Heritage, White Minimal, Artisan Fusion, Heavy-Duty Hotelware and Majestic Decorative ranges for export buyers.";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CollectionsIndex,
});

function CollectionsIndex() {
  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Collections</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.6rem)] leading-tight">
            Ceramic ranges organised by design language and end use.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            Each collection groups products with a shared aesthetic and production approach.
            Specifications, minimum quantities and lead times are confirmed per programme.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl space-y-16 px-5 lg:px-10">
          {COLLECTIONS.map((collection, index) => (
            <article
              key={collection.id}
              className={`grid items-center gap-10 lg:grid-cols-2 ${
                index % 2 === 1 ? "lg:[&>figure]:order-2" : ""
              }`}
            >
              <figure className="border border-border bg-sand">
                <img
                  src={collection.image}
                  alt={collection.imageAlt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                  {productsByCollection(collection.id).length} Products
                </p>
                <h2 className="mt-4 text-[clamp(1.6rem,3.2vw,2.4rem)]">{collection.name}</h2>
                <p className="mt-5 text-muted-foreground">{collection.description}</p>
                <Link
                  to="/collections/$slug"
                  params={{ slug: collection.id }}
                  className="btn btn-outline mt-8"
                >
                  View Collection
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <CtaBand
        title="Need a range built around your market?"
        body="Tell us the categories, price positioning and destination market you are working towards, and we will propose a suitable product set."
      />
    </>
  );
}
