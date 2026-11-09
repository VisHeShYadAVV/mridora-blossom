import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { EnquiryButtons, outlineButton } from "@/components/site/Enquire";
import { ProductCard, SampleBadge } from "@/components/site/ProductCard";
import { ON_REQUEST } from "@/data/catalog";
import { DocumentList } from "@/components/site/Blocks";
import { getProducts, getPublicDocuments, getSiteData } from "@/lib/data";
import { useQuoteList } from "@/lib/quote-list";
import { absoluteUrl, jsonLd, pageHead } from "@/lib/seo";
import { SPEC_FIELDS, type Product } from "@/lib/types";

export const Route = createFileRoute("/_site/products/$slug")({
  loader: async ({ params }) => {
    const [{ collections, subcategories, settings }, products, allDocuments] = await Promise.all([
      getSiteData(),
      getProducts(),
      getPublicDocuments(),
    ]);
    const product = products.find((p) => p.slug === params.slug);
    const subcategory = subcategories.find((s) => s.id === product?.subcategoryId);
    const collection = collections.find((c) => c.code === subcategory?.collectionCode);
    if (!product || !subcategory || !collection) throw notFound();
    const explicit = products.filter((p) => product.relatedSkus.includes(p.sku));
    const prefix = `${collection.code}-`;
    const sameCollection = products.filter(
      (p) => p.id !== product.id && p.subcategoryId.startsWith(prefix) && !explicit.includes(p),
    );
    const sameSubFirst = [...sameCollection].sort(
      (a, b) =>
        Number(b.subcategoryId === product.subcategoryId) -
        Number(a.subcategoryId === product.subcategoryId),
    );
    return {
      product,
      subcategory,
      collection,
      schemaProduct: settings.seo.schemaProduct,
      documents: allDocuments.filter((d) => d.productSku === product.sku),
      related: [...explicit, ...sameSubFirst].slice(0, 3),
    };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return {};
    const { product: p, collection, subcategory, schemaProduct } = loaderData;
    const head = pageHead({
      title: p.seoTitle || `${p.name} (${p.sku}) | ${subcategory.name} | MRIDORA`,
      description:
        p.seoDescription ||
        `${p.name}, SKU ${p.sku}, in the MRIDORA ${collection.name} collection. View specifications and request an export quotation.`,
      path: `/products/${params.slug}`,
      canonical: p.canonical,
      ...(p.images[0] ? { image: p.images[0] } : {}),
    });
    // Sample listings are placeholders and must not be indexed as real products.
    if (p.isSample)
      return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
    if (!schemaProduct) return head;
    return {
      ...head,
      scripts: [
        jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          sku: p.sku,
          description: p.overview,
          category: `${collection.name} > ${subcategory.name}`,
          brand: { "@type": "Brand", name: "MRIDORA" },
          countryOfOrigin: "India",
          image: p.images.map((src) => (src.startsWith("/") ? absoluteUrl(src) : src)),
        }),
      ],
    };
  },
  component: Page,
});

function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [origin, setOrigin] = useState<string | null>(null);
  const src = product.images[active];
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(
      `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
    );
  };
  return (
    <div>
      <div
        onMouseMove={onMove}
        onMouseLeave={() => setOrigin(null)}
        className="relative aspect-square cursor-zoom-in overflow-hidden border border-border bg-stone"
      >
        {src ? (
          <img
            src={src}
            alt={product.imageAlts[active] ?? product.name}
            className="h-full w-full object-cover transition-transform duration-200"
            style={origin ? { transform: "scale(2)", transformOrigin: origin } : undefined}
          />
        ) : (
          <p className="flex h-full items-center justify-center text-muted-foreground">
            Photograph available on request
          </p>
        )}
      </div>
      {product.images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {product.images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              className={`h-20 w-20 overflow-hidden border ${i === active ? "border-gold" : "border-border"}`}
            >
              <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Page() {
  const { product, subcategory, collection, related, documents } = Route.useLoaderData();
  const { add, has } = useQuoteList();
  const inList = has(product.sku);
  const rows: [string, string][] = [
    ["Product Name", product.name],
    ["SKU Code", product.sku],
    ["Main Collection", collection.name],
    ["Product Category", subcategory.name],
    ...SPEC_FIELDS.map(([key, label]): [string, string] => [
      label,
      product.specs[key] || ON_REQUEST,
    ]),
    ...product.customSpecs.map((c): [string, string] => [c.label, c.value || ON_REQUEST]),
  ];
  return (
    <section className="py-10 lg:py-14">
      <div className="wrap">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Collections", path: "/collections" },
            { name: collection.name, path: `/collections/${collection.slug}` },
            { name: subcategory.name, path: `/collections/${collection.slug}/${subcategory.slug}` },
            { name: product.name },
          ]}
        />
        {product.isSample && (
          <p className="mt-6 border border-gold bg-accent p-4 text-sm text-accent-foreground">
            <strong className="font-medium">Sample listing.</strong> This is a placeholder and the
            image is illustrative only, not a photograph of this product. Contact the export desk
            for current products and verified specifications.
          </p>
        )}
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <Gallery product={product} />
          <div>
            {product.isSample && <SampleBadge />}
            <h1 className="mt-3 text-[clamp(2rem,4vw,3.2rem)] leading-[1.1] text-primary">
              {product.name}
            </h1>
            <p className="mt-3 font-mono text-sm text-muted-foreground">SKU: {product.sku}</p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{product.overview}</p>
            <div className="mt-8">
              <EnquiryButtons product={product} />
            </div>
            <button
              type="button"
              disabled={inList}
              onClick={() => add({ sku: product.sku, name: product.name })}
              className={`${outlineButton} mt-3 disabled:opacity-60`}
            >
              {inList ? "Added to quote list" : "Add to quote list"}
            </button>
            {product.specSheetUrl && (
              <a
                href={product.specSheetUrl}
                className="mt-5 block text-primary underline underline-offset-4"
              >
                Download specification sheet
              </a>
            )}
            <h2 className="mt-10 text-2xl text-primary">Colours & Finishes</h2>
            <p className="mt-2 text-muted-foreground">
              Colours: {product.colours.length ? product.colours.join(", ") : ON_REQUEST}. Finish:{" "}
              {product.finish}.
            </p>
            <h2 className="mt-8 text-2xl text-primary">Customization</h2>
            <p className="mt-2 text-muted-foreground">{product.customizationInfo}</p>
            <h2 className="mt-8 text-2xl text-primary">Packaging</h2>
            <p className="mt-2 text-muted-foreground">{product.packagingInfo}</p>
          </div>
        </div>

        <h2 className="mt-16 text-3xl text-primary">Technical Specifications</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border border-border bg-card text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-normal">
                  Specification
                </th>
                <th scope="col" className="px-4 py-3 font-normal">
                  Information
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t border-border">
                  <th scope="row" className="w-2/5 px-4 py-3 font-normal text-muted-foreground">
                    {label}
                  </th>
                  <td className="px-4 py-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documents.length > 0 && (
          <>
            <h2 className="mt-16 text-3xl text-primary">Documents for This Product</h2>
            <DocumentList documents={documents} />
          </>
        )}

        {related.length > 0 && (
          <>
            <h2 className="mt-16 text-3xl text-primary">Related Products</h2>
            <div className="product-grid mt-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
