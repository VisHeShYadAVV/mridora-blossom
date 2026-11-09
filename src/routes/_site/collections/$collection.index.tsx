import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EnquiryButtons } from "@/components/site/Enquire";
import { PageHero } from "@/components/site/PageHero";
import { ProductBrowser } from "@/components/site/ProductBrowser";
import { getProducts, getSiteData } from "@/lib/data";
import { breadcrumbLd, jsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_site/collections/$collection/")({
  loader: async ({ params }) => {
    const { collections, subcategories, settings } = await getSiteData();
    const collection = collections.find((c) => c.slug === params.collection);
    if (!collection) throw notFound();
    const subs = subcategories.filter((s) => s.collectionCode === collection.code);
    const products = (await getProducts()).filter((p) =>
      p.subcategoryId.startsWith(`${collection.code}-`),
    );
    return {
      schemaBreadcrumbs: settings.seo.schemaBreadcrumbs,
      collection,
      collections,
      subs,
      products,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const c = loaderData.collection;
    const path = `/collections/${params.collection}`;
    return {
      ...pageHead({ title: c.seoTitle, description: c.seoDescription, path, image: c.image }),
      scripts: !loaderData.schemaBreadcrumbs
        ? []
        : [
            jsonLd(
              breadcrumbLd([
                { name: "Home", path: "/" },
                { name: "Collections", path: "/collections" },
                { name: c.name, path },
              ]),
            ),
          ],
    };
  },
  component: Page,
});

function Page() {
  const { collection, collections, subs, products } = Route.useLoaderData();
  return (
    <>
      <PageHero eyebrow="Collection" title={collection.name} intro={collection.description} />
      <section className="py-12">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Collections", path: "/collections" },
              { name: collection.name },
            ]}
          />
          <div className="mt-8">
            <EnquiryButtons />
          </div>
          <h2 className="mt-12 text-3xl text-primary">Categories</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {subs.map((s) => (
              <Link
                key={s.id}
                to="/collections/$collection/$subcategory"
                params={{ collection: collection.slug, subcategory: s.slug }}
                className="border border-border bg-card p-4 text-primary transition-colors hover:border-gold"
              >
                {s.name}
              </Link>
            ))}
          </div>
          <div className="mt-12">
            <ProductBrowser
              products={products}
              collections={collections}
              subcategories={subs}
              fixedCollection={collection.code}
            />
          </div>
        </div>
      </section>
    </>
  );
}
