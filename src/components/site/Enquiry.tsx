import { useState } from "react";

const BUYERS = [
  "Importers",
  "Distributors",
  "Hotels",
  "Restaurants",
  "Hospitality Groups",
  "Retailers",
  "Interior Designers",
];

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Italy",
  "United States",
  "Canada",
  "Australia",
  "Japan",
  "Singapore",
  "Other",
];

const PRODUCTS = [
  "Ceramic Dinnerware",
  "Decorative Ceramics",
  "Hospitality Collection",
  "Custom Ceramic Solutions",
];

const VOLUMES = [
  "Under 1,000 pieces",
  "1,000 – 5,000 pieces",
  "5,000 – 20,000 pieces",
  "20,000+ pieces",
];

const fieldClass =
  "mt-3 w-full border border-input bg-card px-4 py-3.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export function Enquiry() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    const body = [
      `Full Name: ${get("name")}`,
      `Company: ${get("company")}`,
      `Email: ${get("email")}`,
      `Country: ${get("country")}`,
      `Product Requirement: ${get("product")}`,
      `Quantity Requirement: ${get("quantity")}`,
      "",
      "Additional Details:",
      get("message") || "—",
    ].join("\n");

    window.location.href = `mailto:exports@mridora.com?subject=${encodeURIComponent(
      `Ceramic Export Enquiry — ${get("company") || get("name")}`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <section id="enquiry" className="py-28 lg:py-36">
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <div className="text-center">
          <h2 className="text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.1]">
            Looking for a Reliable Ceramic Supplier?
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Whether you need dinnerware, decorative pieces, hospitality collections, or fully custom
            ceramic solutions — tell us your requirement and our export team will respond within 24
            hours.
          </p>

          <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {BUYERS.map((buyer) => (
              <li key={buyer} className="eyebrow text-muted-foreground">
                {buyer}
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-16 border border-border bg-sand p-8 md:p-12"
          noValidate={false}
        >
          <div className="grid gap-8 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">Full Name *</span>
              <input required name="name" placeholder="John Doe" className={fieldClass} />
            </label>

            <label className="block">
              <span className="text-sm">Company Name *</span>
              <input
                required
                name="company"
                placeholder="Acme Imports Ltd."
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm">Email Address *</span>
              <input
                required
                type="email"
                name="email"
                placeholder="john@example.com"
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className="text-sm">Country *</span>
              <select required name="country" defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Select a country
                </option>
                {COUNTRIES.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Product Requirement *</span>
              <select required name="product" defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Select product type
                </option>
                {PRODUCTS.map((product) => (
                  <option key={product}>{product}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm">Quantity Requirement *</span>
              <select required name="quantity" defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Select volume
                </option>
                {VOLUMES.map((volume) => (
                  <option key={volume}>{volume}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-8 block">
            <span className="text-sm">Additional Details / Message</span>
            <textarea
              name="message"
              rows={5}
              placeholder="Describe your specific requirements, custom design needs, target markets, or timeline..."
              className={fieldClass}
            />
          </label>

          <button
            type="submit"
            className="mt-10 w-full bg-primary px-10 py-5 eyebrow text-primary-foreground transition-colors hover:bg-primary/85 md:w-auto"
          >
            Send Enquiry
          </button>

          {sent && (
            <p className="mt-6 text-sm text-muted-foreground" role="status">
              Your email app should now be open with the enquiry ready to send. If nothing happened,
              write to exports@mridora.com directly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
