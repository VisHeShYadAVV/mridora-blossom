import { Link } from "@tanstack/react-router";

import { useQuoteList } from "@/lib/quote-list";
import type { Product } from "@/lib/types";

export function SampleBadge() {
  return (
    <span className="bg-gold px-2 py-1 text-[11px] tracking-wide text-navy-deep">
      Sample listing
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { add, has } = useQuoteList();
  const inList = has(product.sku);
  return (
    <article className="flex flex-col border border-border bg-card">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-stone"
      >
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.imageAlts[0] ?? product.name}
            loading="lazy"
            className="card-zoom h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {product.isSample && <SampleBadge />}
          {product.newArrival && (
            <span className="bg-primary px-2 py-1 text-[11px] tracking-wide text-primary-foreground">
              New arrival
            </span>
          )}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl leading-snug text-primary">{product.name}</h3>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{product.sku}</p>
        <p className="mt-1 text-sm text-muted-foreground">Material: {product.material}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-sm">
          <Link
            to="/products/$slug"
            params={{ slug: product.slug }}
            className="text-primary underline-offset-4 hover:underline"
          >
            View Details
          </Link>
          <Link
            to="/request-a-quote"
            search={{ sku: product.sku }}
            className="text-primary underline-offset-4 hover:underline"
          >
            Request a Quote
          </Link>
          <button
            type="button"
            disabled={inList}
            onClick={() => add({ sku: product.sku, name: product.name })}
            className="text-muted-foreground underline-offset-4 enabled:hover:underline disabled:text-gold"
          >
            {inList ? "In quote list" : "Add to quote list"}
          </button>
        </div>
      </div>
    </article>
  );
}
