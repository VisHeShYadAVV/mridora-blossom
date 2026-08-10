import { createFileRoute, Link } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import { ProductCard } from "@/components/site/ProductCard";
import hero from "@/assets/hero-ceramics.jpg";
import { CATEGORIES, COLLECTIONS, PRODUCTS } from "@/data/catalog";

const title = "Indian Ceramic Tableware, Hotelware & Decorative Ceramics — MRIDORA";
const description =
  "MRIDORA sources Indian ceramic tableware, hotelware, serveware and decorative ceramics from established manufacturers and exports to importers, distributors, HORECA and retail buyers worldwide.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const BUYER_SEGMENTS = [
  "OEM & Private Label",
  "HORECA",
  "Retail",
  "Importers & Distributors",
];

const CAPABILITIES = [
  {
    title: "Sourcing Network",
    body: "We work with established ceramic manufacturing clusters in India and match each enquiry to a suitable production partner.",
  },
  {
    title: "OEM & Private Label",
    body: "Buyer-specific shapes, decoration, branding and packaging developed against your specification.",
  },
  {
    title: "Export Packaging",
    body: "Inner protection, master cartons, carton marking and palletisation planned per product fragility and destination handling.",
  },
  {
    title: "Documentation",
    body: "Commercial invoice, packing list and standard export paperwork prepared by our export desk; market-specific documents on request.",
  },
  {
    title: "Inspection Coordination",
    body: "Pre-shipment checks coordinated with production partners and, where required, third-party inspection agencies at buyer cost.",
  },
  {
    title: "Samples & Shipping Support",
    body: "Sample development and dispatch, freight coordination with forwarders and dispatch updates through to shipment.",
  },
];

const WHY_MRIDORA = [
  {
    title: "Sourcing network",
    body: "Direct working relationships with Indian ceramic units, so each requirement is placed with a unit suited to that shape, body and decoration.",
  },
  {
    title: "Khurja & Indian manufacturing access",
    body: "Access to Khurja and other Indian ceramic clusters for tableware, hotelware, serveware and decorative production.",
  },
  {
    title: "Quality coordination",
    body: "Specification sign-off, in-production review and pre-shipment checks coordinated on the buyer's behalf.",
  },
  {
    title: "Customization",
    body: "Shape, glaze, decoration, branding and packaging adjusted to buyer specification, subject to production feasibility.",
  },
  {
    title: "Export packaging",
    body: "Packing planned for long-haul ceramic freight, with buyer carton marking and palletisation options.",
  },
  {
    title: "Documentation",
    body: "Export documentation handled in-house and aligned with destination-market requirements confirmed per order.",
  },
];

const GULF_MARKETS = ["UAE", "Saudi Arabia", "Qatar", "Oman", "Kuwait", "Bahrain"];
const OTHER_MARKETS = ["Europe", "North America", "Asia Pacific"];

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
          <h1 className="mt-6 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5.4vw,4.2rem)] leading-[1.06]">
            Indian Ceramic Tableware, Hotelware &amp; Decorative Ceramics
          </h1>
          <p className="mt-7 max-w-2xl text-lg text-navy-foreground/80">
            Sourced from established Indian ceramic manufacturers and exported to international
            buyers.
          </p>
          <ul className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-[0.16em] text-navy-foreground/70">
            {BUYER_SEGMENTS.map((segment, index) => (
              <li key={segment} className="flex items-center gap-4">
                {index > 0 && <span aria-hidden="true" className="text-gold">·</span>}
                {segment}
              </li>
            ))}
          </ul>

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

      <section className="border-t border-border py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                Product Categories
              </p>
              <h2 className="mt-4 text-[clamp(1.8rem,3.6vw,2.7rem)]">
                Tableware · Hotelware · Serveware · Decorative Ceramics
              </h2>
            </div>
            <Link to="/products" className="btn btn-outline">
              Browse Catalogue
            </Link>
          </div>

          <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link key={category.id} to="/products" className="bg-card p-7 hover:bg-sand">
                <h3 className="text-lg">{category.name}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-primary">
                Design Collections
              </p>
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

      <section className="bg-sand py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Why MRIDORA</p>
            <h2 className="mt-5 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-tight">
              A single point of contact between your specification and Indian production.
            </h2>
          </div>
          <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {WHY_MRIDORA.map((item) => (
              <div key={item.title} className="bg-card p-7">
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Sourcing Base</p>
            <h2 className="mt-5 text-[clamp(1.8rem,3.6vw,2.7rem)] leading-tight">
              Sourcing from Khurja, India
            </h2>
            <p className="mt-6 text-muted-foreground">
              Khurja, in Uttar Pradesh, is one of India's long-established ceramic manufacturing
              clusters, with units producing tableware, hotelware, serveware and decorative
              ceramics. We source from Khurja and other Indian ceramic clusters, selecting a unit
              according to the body, shape and decoration a buyer requires.
            </p>
            <p className="mt-4 text-muted-foreground">
              Because production is spread across specialised units, we confirm feasibility,
              minimum quantities and lead times per programme rather than quoting a single
              standard capability. We do not own a factory and do not present partner facilities
              as our own.
            </p>
            <Link to="/about" className="btn btn-outline mt-8">
              About Our Sourcing Model
            </Link>
          </div>
          <img
            src={hero}
            alt="Indian ceramic tableware and decorative pieces arranged for export inspection"
            width={1200}
            height={900}
            loading="lazy"
            className="aspect-[4/3] w-full border border-border object-cover"
          />
        </div>
      </section>

      <section className="border-y border-border py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-primary">Target Markets</p>
          <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {GULF_MARKETS.map((market) => (
              <li key={market} className="text-lg">
                {market}
              </li>
            ))}
          </ul>
          <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
            {OTHER_MARKETS.map((market) => (
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
