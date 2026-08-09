import { Link } from "@tanstack/react-router";

import { formatInquiryLines, useInquiry } from "@/lib/inquiry";

export function InquiryDrawer() {
  const { items, isOpen, closeInquiry, removeItem, setQuantity, clearInquiry } = useInquiry();

  if (!isOpen) return null;

  const mailto = `mailto:exports@mridora.com?subject=${encodeURIComponent(
    "Product Inquiry — MRIDORA GLOBAL",
  )}&body=${encodeURIComponent(
    ["Requested items:", formatInquiryLines(items) || "—", "", "Company:", "Country:", "Notes:"].join(
      "\n",
    ),
  )}`;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close inquiry list"
        onClick={closeInquiry}
        className="absolute inset-0 bg-navy/60"
      />
      <aside
        role="dialog"
        aria-label="Inquiry list"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-soft"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg">Inquiry List</h2>
          <button
            type="button"
            onClick={closeInquiry}
            className="inline-flex h-12 w-12 items-center justify-center text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products added yet. Browse the catalogue and add items to build a single bulk
              inquiry.
            </p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.sku} className="border-b border-border/70 pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {item.sku}
                      </p>
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        onClick={closeInquiry}
                        className="text-base hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.sku)}
                      className="min-h-11 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                  <label className="mt-3 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Quantity required
                    <input
                      value={item.quantity}
                      onChange={(event) => setQuantity(item.sku, event.target.value)}
                      placeholder="To Be Confirmed"
                      className="field"
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="space-y-3 border-t border-border px-5 py-4">
          <Link to="/request-quote" onClick={closeInquiry} className="btn btn-primary w-full">
            Request Quote
          </Link>
          <div className="flex gap-3">
            <a href={mailto} className="btn btn-outline flex-1">
              Email List
            </a>
            {items.length > 0 && (
              <button type="button" onClick={clearInquiry} className="btn btn-outline flex-1">
                Clear
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>
  );
}
