import { Link } from "@tanstack/react-router";

import type { ProductRecord } from "@/data/catalog";
import { collectionName } from "@/data/catalog";
import { useInquiry } from "@/lib/inquiry";

export function ProductCard({ product }: { product: ProductRecord }) {
  const { addProduct, hasProduct } = useInquiry();
  const added = hasProduct(product.sku);

  return (
    <article className="group flex flex-col border border-border bg-card">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-sand"
      >
        <img
          src={product.image}
          alt={product.imageAlt}
          width={800}
          height={800}
          loading="lazy"
          className="aspect-square w-full object-contain p-6 transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {product.sku}
        </p>
        <h3 className="mt-2 text-lg leading-snug">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{collectionName(product.collection)}</p>
        <p className="mt-3 text-sm text-muted-foreground">{product.keyDimension}</p>

        <div className="mt-5 flex flex-1 flex-col justify-end gap-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Pricing: {product.moq}
          </p>
          <button
            type="button"
            onClick={() => addProduct(product)}
            className={`btn ${added ? "btn-outline" : "btn-primary"} w-full`}
          >
            {added ? "In Inquiry List" : "Add to Inquiry"}
          </button>
        </div>
      </div>
    </article>
  );
}
