import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EnquiryButtons } from "@/components/site/Enquire";
import { PageHero } from "@/components/site/PageHero";
import { ProductBrowser } from "@/components/site/ProductBrowser";
import { getProducts } from "@/lib/data";
import { pageHead } from "@/lib/seo";
import { useSite } from "@/lib/use-site";

export const Route = createFileRoute("/_site/collections/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  loader: async () => ({ products: await getProducts() }),
  head: () =>
    pageHead({
      title: "Ceramic Collections | Tableware, Hotelware & Terracotta | MRIDORA",
      description:
        "Browse MRIDORA ceramic collections: tableware, HORECA hotelware, serveware, decorative ceramics and terracotta, sourced from India for B2B export.",
      path: "/collections",
    }),
  component: Page,
});

function Page() {
  const { products } = Route.useLoaderData();
  const { q } = Route.useSearch();
  const { collections, subcategories } = useSite();
  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Collections"
        intro="Five ceramic collections for international wholesale, hospitality and private-label buyers. Search by product name or SKU, or filter the full catalogue."
      />
      <section className="py-12">
        <div className="wrap">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Collections" }]} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {collections.map((c) => (
              <Link
                key={c.code}
                to="/collections/$collection"
                params={{ collection: c.slug }}
                className="border border-border bg-card p-5 transition-colors hover:border-gold"
              >
                <span className="font-display text-xl text-primary">{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <EnquiryButtons />
          </div>
          <div className="mt-12">
            <ProductBrowser
              products={products}
              collections={collections}
              subcategories={subcategories}
              initialQuery={q ?? ""}
            />
          </div>
        </div>
      </section>
    </>
  );
}
