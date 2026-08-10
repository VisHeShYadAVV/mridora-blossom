import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import { ProductCard } from "@/components/site/ProductCard";
import {
  categoryName,
  collectionName,
  getProduct,
  relatedProducts,
  type ProductRecord,
} from "@/data/catalog";
import { useInquiry } from "@/lib/inquiry";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product, related: relatedProducts(product) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product not found — MRIDORA" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    const title = `${product.name} (${product.sku}) — MRIDORA`;
    const description = `${product.shortDescription} ${product.keyDimension}. Export supply from India; minimum quantity and lead time confirmed on enquiry.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductDetail,
});

function ProductNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-40 pb-24 text-center">
      <h1 className="text-3xl">Product not found</h1>
      <p className="mt-4 text-muted-foreground">
        This product reference is not available. Browse the full catalogue instead.
      </p>
      <Link to="/products" className="btn btn-primary mt-8">
        Browse Catalogue
      </Link>
    </div>
  );
}

function ProductDetail() {
  const { product, related } = Route.useLoaderData();
  const { addProduct, hasProduct, openInquiry } = useInquiry();
  const added = hasProduct(product.sku);

  const specs: Array<[string, string]> = [
    ["SKU", product.sku],
    ["Collection", collectionName(product.collection)],
    ["Category", categoryName(product.category)],
    ["Key Dimension", product.keyDimension],
    ...(product.capacity ? ([["Capacity", product.capacity]] as Array<[string, string]>) : []),
    ["Material", product.material],
    ["Finish", product.finish],
    ["Colour", product.color],
    ["Minimum Order Quantity", product.moq],
    ["Lead Time", product.leadTime],
    ...(product.foodSafety
      ? ([["Food Contact Suitability", product.foodSafety]] as Array<[string, string]>)
      : []),
    ["OEM Development", product.oemAvailable ? "Available on Request" : "Not offered"],
    [
      "Private Label / Branding",
      product.privateLabelAvailable ? "Available on Request" : "Not offered",
    ],
    ["Export Packaging", product.exportPackaging],
  ];

  return (
    <>
      <section className="pt-28 lg:pt-36">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <nav className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Link to="/products" className="hover:text-foreground">
              Catalogue
            </Link>
            <span> / </span>
            <Link
              to="/collections/$slug"
              params={{ slug: product.collection }}
              className="hover:text-foreground"
            >
              {collectionName(product.collection)}
            </Link>
          </nav>

          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <figure className="border border-border bg-sand">
              <img
                src={product.image}
                alt={product.imageAlt}
                width={1000}
                height={1000}
                className="aspect-square w-full object-contain p-8"
              />
            </figure>

            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {product.sku}
              </p>
              <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.9rem)] leading-tight">{product.name}</h1>
              <p className="mt-5 text-lg text-muted-foreground">{product.shortDescription}</p>

              <div className="mt-8 border border-border bg-card p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Pricing</p>
                <p className="mt-2 text-xl">Available on Request</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Quoted against quantity, decoration, packaging and destination port.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => (added ? openInquiry() : addProduct(product))}
                  className={`btn ${added ? "btn-outline" : "btn-primary"} sm:flex-1`}
                >
                  {added ? "View Inquiry List" : "Add to Inquiry"}
                </button>
                <Link to="/request-quote" className="btn btn-outline sm:flex-1">
                  Request Quote
                </Link>
              </div>

              <dl className="mt-10 divide-y divide-border border-y border-border">
                {specs.map(([label, value]) => (
                  <div key={label} className="grid gap-1 py-4 sm:grid-cols-3">
                    <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-10">
            <h2 className="text-[clamp(1.5rem,3vw,2.2rem)]">Related Products</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item: ProductRecord) => (
                <ProductCard key={item.sku} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand
        title="Request pricing for this product."
        body="Send target quantity, decoration requirement and destination market. We confirm feasibility with production partners before quoting."
      />
    </>
  );
}
