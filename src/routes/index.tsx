import { createFileRoute, Link } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import { ProductCard } from "@/components/site/ProductCard";
import hero from "@/assets/hero-ceramics.jpg";
import { COLLECTIONS, PRODUCTS } from "@/data/catalog";

const title = "MRIDORA — Ceramic Sourcing & Merchant Exports from India";
const description =
  "MRIDORA is an Indian ceramic sourcing and merchant export company supplying tableware, hotelware, decorative ceramics and OEM private-label programmes to importers, hospitality groups and retailers worldwide.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Home,
});

const CAPABILITIES = [
  {
    title: "Sourcing Network",
    body: "We work with established ceramic manufacturing clusters in India and match each enquiry to a suitable production partner.",
  },
  {
    title: "Export Documentation",
    body: "Commercial documentation, packing lists and shipment coordination handled by our export desk.",
  },
  {
    title: "OEM & Private Label",
    body: "Buyer-specific shapes, decoration, branding and packaging developed against your specification.",
  },
  {
    title: "Inspection Support",
    body: "Pre-shipment checks coordinated with production partners and, where required, third-party inspection agencies.",
  },
];

const MARKETS = ["Gulf & Middle East", "Europe", "North America", "Asia Pacific"];

function Home() {
  const featured = PRODUCTS.slice(0, 8);

  return (
    <>
      <section className="relative flex min-h-[86vh] items-center">
        <img
          src={hero}
          alt="Editorial arrangement of Indian ceramic tableware and decorative pieces on a navy backdrop"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/92 via-navy/70 to-navy/35" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-28 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
            Ceramic Sourcing &amp; Merchant Exports · India
          </p>
          <h1 className="mt-6 max-w-3xl text-navy-foreground text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.05]">
            Indian ceramics, sourced and exported to buyer specification.
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-navy-foreground/80">
            MRIDORA is a merchant exporter. We source tableware, hotelware and decorative
            ceramics from Indian manufacturing partners and manage specification, inspection
            coordination and export logistics for international buyers.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/collections" className="btn btn-gold">
              View Collections
            </Link>
            <Link to="/request-quote" className="btn btn-on-navy">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Who We Are</p>
            <h2 className="mt-5 text-[clamp(1.9rem,4vw,3rem)] leading-tight">
              A sourcing partner, not a factory.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              We do not operate our own manufacturing unit. Our role is to translate a buyer's
              requirement into a producible specification, place it with a suitable Indian ceramic
              manufacturer, and manage the order through to shipment. Product feasibility, minimum
              quantities and lead times are confirmed for each programme.
            </p>
          </div>

          <div className="mt-14 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="bg-card p-7">
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Our Range</p>
              <h2 className="mt-4 text-[clamp(1.8rem,3.6vw,2.7rem)]">Collections</h2>
            </div>
            <Link to="/collections" className="btn btn-outline">
              All Collections
            </Link>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$slug"
                params={{ slug: collection.id }}
                className="group block border border-border bg-card"
              >
                <img
                  src={collection.image}
                  alt={collection.imageAlt}
                  width={1200}
                  height={900}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="p-6">
                  <h3 className="text-xl">{collection.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {collection.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Catalogue</p>
              <h2 className="mt-4 text-[clamp(1.8rem,3.6vw,2.7rem)]">Selected Products</h2>
            </div>
            <Link to="/products" className="btn btn-outline">
              Browse All Products
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Buyer Markets</p>
          <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
            {MARKETS.map((market) => (
              <li key={market} className="text-lg text-muted-foreground">
                {market}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title="Share your requirement and we will revert with a sourcing proposal."
        body="Send product references, target quantities and destination market. Our export desk reviews feasibility with production partners and responds with available options."
      />
    </>
  );
}
