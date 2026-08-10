import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { formatInquiryLines, useInquiry } from "@/lib/inquiry";

const title = "Request a Quote — MRIDORA Ceramic Exports";
const description =
  "Submit a bulk ceramic enquiry to MRIDORA. Share product references, quantities and destination market, and our export desk will respond with feasibility and pricing.";

export const Route = createFileRoute("/request-quote")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: RequestQuotePage,
});

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Italy",
  "Spain",
  "United States",
  "Canada",
  "Australia",
  "Japan",
  "Singapore",
  "Other",
];

const BUYER_TYPES = [
  "Importer / Distributor",
  "Hotel or Restaurant Group",
  "Retail Chain / Concept Store",
  "Interior Designer / Project Buyer",
  "Other",
];

const CATEGORY_INTEREST = [
  "Tableware",
  "Hotelware",
  "Decorative Ceramics",
  "OEM / Private Label",
  "Mixed Requirement",
];

const VOLUMES = [
  "Under 1,000 pieces",
  "1,000 – 5,000 pieces",
  "5,000 – 20,000 pieces",
  "20,000+ pieces",
  "To Be Confirmed",
];

function RequestQuotePage() {
  const { items, count, removeItem, setQuantity, openInquiry } = useInquiry();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const body = [
      `Company: ${get("company")}`,
      `Contact Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Phone / WhatsApp: ${get("phone") || "—"}`,
      `Country / Destination Market: ${get("country")}`,
      `Buyer Type: ${get("buyerType")}`,
      `Category of Interest: ${get("categoryInterest")}`,
      `Estimated Volume: ${get("volume")}`,
      "",
      "Requested Products:",
      items.length ? formatInquiryLines(items) : "None selected — see notes",
      "",
      "Notes:",
      get("notes") || "—",
    ].join("\n");

    window.location.href = `mailto:export@mridoraglobal.com?subject=${encodeURIComponent(
      `Quote Request — ${get("company") || get("name")}`,
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Request a Quote</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            One request, multiple products.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            Pricing is quoted per enquiry. Share your product references, quantities and destination
            market and our export desk will confirm feasibility with production partners.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-5 lg:px-10">
          <div className="border border-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl">Your inquiry list ({count})</h2>
              <button type="button" onClick={openInquiry} className="btn btn-outline">
                Edit List
              </button>
            </div>

            {items.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                No products selected yet. You can still submit this form and describe your
                requirement, or{" "}
                <Link to="/products" className="underline decoration-gold underline-offset-4">
                  browse the catalogue
                </Link>{" "}
                to add SKUs.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-border border-y border-border">
                {items.map((item) => (
                  <li key={item.sku} className="grid gap-3 py-4 sm:grid-cols-[1fr_11rem_auto]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        {item.sku}
                      </p>
                      <Link
                        to="/products/$slug"
                        params={{ slug: item.slug }}
                        className="hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <input
                      value={item.quantity}
                      onChange={(event) => setQuantity(item.sku, event.target.value)}
                      placeholder="Quantity"
                      aria-label={`Quantity for ${item.sku}`}
                      className="field !mt-0"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.sku)}
                      className="min-h-12 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-10 border border-border bg-sand p-6 md:p-10">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm">
                Company Name *
                <input required name="company" placeholder="Acme Imports Ltd." className="field" />
              </label>
              <label className="block text-sm">
                Contact Name *
                <input required name="name" placeholder="Full name" className="field" />
              </label>
              <label className="block text-sm">
                Email Address *
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="buyer@company.com"
                  className="field"
                />
              </label>
              <label className="block text-sm">
                Phone / WhatsApp
                <input name="phone" placeholder="+00 000 000 0000" className="field" />
              </label>
              <label className="block text-sm">
                Country / Destination Market *
                <select required name="country" defaultValue="" className="field">
                  <option value="" disabled>
                    Select country
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country}>{country}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Buyer Type *
                <select required name="buyerType" defaultValue="" className="field">
                  <option value="" disabled>
                    Select buyer type
                  </option>
                  {BUYER_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Category of Interest *
                <select required name="categoryInterest" defaultValue="" className="field">
                  <option value="" disabled>
                    Select category
                  </option>
                  {CATEGORY_INTEREST.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Estimated Volume *
                <select required name="volume" defaultValue="" className="field">
                  <option value="" disabled>
                    Select volume
                  </option>
                  {VOLUMES.map((volume) => (
                    <option key={volume}>{volume}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-6 block text-sm">
              Requirement Details
              <textarea
                name="notes"
                rows={5}
                placeholder="Product references, decoration or branding needs, packaging, target price positioning, timeline…"
                className="field"
              />
            </label>

            <button type="submit" className="btn btn-primary mt-8 w-full md:w-auto">
              Submit Request
            </button>

            {submitted && (
              <p className="mt-5 text-sm text-muted-foreground" role="status">
                Your email application should open with the request prepared. If it does not, write
                to export@mridoraglobal.com and we will pick it up from there.
              </p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
