import { createFileRoute, notFound } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EnquiryButtons } from "@/components/site/Enquire";
import { PageHero } from "@/components/site/PageHero";
import { ProductBrowser } from "@/components/site/ProductBrowser";
import { getProducts, getSiteData } from "@/lib/data";
import { breadcrumbLd, jsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_site/collections/$collection/$subcategory")({
  loader: async ({ params }) => {
    const { collections, subcategories, settings } = await getSiteData();
    const collection = collections.find((c) => c.slug === params.collection);
    const subcategory = subcategories.find(
      (s) => s.slug === params.subcategory && s.collectionCode === collection?.code,
    );
    if (!collection || !subcategory) throw notFound();
    const products = (await getProducts()).filter((p) => p.subcategoryId === subcategory.id);
    return {
      schemaBreadcrumbs: settings.seo.schemaBreadcrumbs,
      collection,
      subcategory,
      collections,
      subcategories,
      products,
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { collection: c, subcategory: s } = loaderData;
    const path = `/collections/${params.collection}/${params.subcategory}`;
    return {
      ...pageHead({ title: s.seoTitle, description: s.seoDescription, path }),
      scripts: !loaderData.schemaBreadcrumbs
        ? []
        : [
            jsonLd(
              breadcrumbLd([
                { name: "Home", path: "/" },
                { name: "Collections", path: "/collections" },
                { name: c.name, path: `/collections/${params.collection}` },
                { name: s.name, path },
              ]),
            ),
          ],
    };
  },
  component: Page,
});

function Page() {
  const { collection, subcategory, collections, subcategories, products } = Route.useLoaderData();
  return (
    <>
      <PageHero
        eyebrow={collection.name}
        title={subcategory.name}
        intro={subcategory.description}
      />
      <section className="py-12">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Collections", path: "/collections" },
              { name: collection.name, path: `/collections/${collection.slug}` },
              { name: subcategory.name },
            ]}
          />
          <div className="mt-8">
            <EnquiryButtons />
          </div>
          <div className="mt-12">
            <ProductBrowser
              products={products}
              collections={collections}
              subcategories={subcategories}
              fixedCollection={collection.code}
              fixedSubcategory={subcategory.id}
            />
          </div>
        </div>
      </section>
    </>
  );
}
