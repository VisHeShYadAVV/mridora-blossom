import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { primaryButton, outlineButton } from "@/components/site/Enquire";
import { track } from "@/lib/analytics";
import { getProducts, submitRfq } from "@/lib/data";
import { itemKey, useQuoteList } from "@/lib/quote-list";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/lib/supabase";
import { useSite } from "@/lib/use-site";

const UPLOAD_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf";
const MIN_FILL_MS = 3000;
const INCOTERMS = ["FOB", "CIF", "Other"];

export const Route = createFileRoute("/_site/request-a-quote")({
  validateSearch: (search: Record<string, unknown>): { sku?: string } =>
    typeof search["sku"] === "string" ? { sku: search["sku"] } : {},
  loader: async () => ({ products: await getProducts() }),
  head: () =>
    pageHead({
      title: "Request a Quote | Ceramic Export Enquiry | MRIDORA",
      description:
        "Send MRIDORA a bulk ceramic quotation enquiry with one or more products, quantities, customization, packaging and shipping requirements.",
      path: "/request-a-quote",
    }),
  component: Page,
});

const field =
  "mt-2 w-full border border-input bg-card px-4 py-3 text-base outline-none focus:border-gold";

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      {required && " *"}
      <input
        name={name}
        type={type}
        required={required}
        maxLength={300}
        placeholder={placeholder}
        className={field}
      />
    </label>
  );
}

function Page() {
  const { products } = Route.useLoaderData();
  const { sku } = Route.useSearch();
  const { settings } = useSite();
  const { fields, maxUploadMb, successTitle, successText } = settings.forms;
  const list = useQuoteList();
  const { add } = list;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "mailto">("idle");
  const [error, setError] = useState("");
  const [extra, setExtra] = useState("");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const product = products.find((p) => p.sku === sku);
    if (product) add({ sku: product.sku, name: product.name });
  }, [sku, products, add]);

  const addExtra = () => {
    const value = extra.trim();
    if (!value) return;
    const match = products.find(
      (p) => p.sku.toLowerCase() === value.toLowerCase() || `${p.name} (${p.sku})` === value,
    );
    add(match ? { sku: match.sku, name: match.name } : { sku: "", name: value });
    setExtra("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (key: string) => String(data.get(key) ?? "").trim();

    // Filled hidden field: almost certainly a bot, so report success and let it move on.
    if (get("mrd_check")) {
      setState("sent");
      return;
    }
    // Too fast could be a person using autofill, so never drop this silently.
    if (Date.now() - startedAt.current < MIN_FILL_MS) {
      setError("Please check your details and press Send Enquiry again.");
      return;
    }
    const upload = data.get("attachment");
    const file = upload instanceof File && upload.size > 0 ? upload : null;
    if (file && file.size > maxUploadMb * 1024 * 1024) {
      setError(`The attachment is larger than ${maxUploadMb} MB. Please send a smaller file.`);
      return;
    }
    if (list.items.length === 0 && !get("message")) {
      setError(
        "Please add at least one product, or describe your requirement under Additional Requirements.",
      );
      return;
    }
    const rfq = {
      company: get("company"),
      country: get("country"),
      email: get("email"),
      phone: get("phone"),
      items: list.items,
      material: get("material"),
      colourFinish: get("colourFinish"),
      customization: get("customization"),
      packaging: get("packaging"),
      destination: get("destination"),
      incoterm: get("incoterm"),
      message: get("message"),
    };

    if (!supabase) {
      const lines = [
        `Buyer / Company: ${rfq.company}`,
        `Country: ${rfq.country}`,
        `Email: ${rfq.email}`,
        `WhatsApp / Contact: ${rfq.phone}`,
        "",
        "Products:",
        ...rfq.items.map(
          (i) =>
            `- ${i.name}${i.sku ? ` (${i.sku})` : ""}: ${i.quantity || "quantity to be discussed"}`,
        ),
        "",
        `Preferred Material: ${rfq.material}`,
        `Colour / Finish: ${rfq.colourFinish}`,
        `Customization / Private Labelling: ${rfq.customization}`,
        `Packaging: ${rfq.packaging}`,
        `Shipping Destination: ${rfq.destination}`,
        `Incoterm: ${rfq.incoterm}`,
        "",
        rfq.message,
      ];
      window.location.href = `mailto:${settings.exportEmail}?subject=${encodeURIComponent(`RFQ: ${rfq.company}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
      setState("mailto");
      return;
    }

    setState("sending");
    try {
      await submitRfq(rfq, file);
      track("rfq");
      list.clear();
      form.reset();
      setState("sent");
    } catch (e) {
      console.error(e);
      setState("idle");
      const limited = (e as { message?: string }).message?.includes("too many enquiries");
      setError(
        limited
          ? `We've received several enquiries from this address recently. Please email ${settings.exportEmail}.`
          : `Your enquiry could not be sent. Please try again or email ${settings.exportEmail}.`,
      );
    }
  };

  if (state === "sent") {
    return (
      <>
        <PageHero title={successTitle} intro={successText} />
        <div className="wrap py-12">
          <Link to="/collections" className={outlineButton}>
            Continue browsing
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="B2B Enquiry"
        title="Request a Quote"
        intro="Add one or more products and share your requirements. There is no payment or online ordering; the export desk replies with a quotation."
      />
      <section className="py-12">
        <div className="wrap max-w-4xl">
          <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Request a Quote" }]} />
          <form onSubmit={onSubmit} className="mt-8 space-y-10">
            <fieldset>
              <legend className="font-display text-2xl text-primary">Products</legend>
              {list.items.length === 0 ? (
                <p className="mt-3 text-muted-foreground">
                  No products added yet.{" "}
                  <Link to="/collections" className="text-primary underline">
                    Browse collections
                  </Link>{" "}
                  or add one below.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border border border-border bg-card">
                  {list.items.map((item) => (
                    <li key={itemKey(item)} className="flex flex-wrap items-center gap-3 p-4">
                      <div className="min-w-48 flex-1">
                        <p>{item.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {item.sku || "No SKU"}
                        </p>
                      </div>
                      <input
                        aria-label={`Required quantity for ${item.name}`}
                        placeholder="Required quantity"
                        value={item.quantity}
                        maxLength={100}
                        onChange={(e) => list.setQuantity(itemKey(item), e.target.value)}
                        className="w-44 border border-input bg-background px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => list.remove(itemKey(item))}
                        aria-label={`Remove ${item.name}`}
                        className="p-1 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <input
                  list="rfq-products"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExtra();
                    }
                  }}
                  aria-label="Add a product by name or SKU"
                  placeholder="Add a product by name or SKU"
                  className="min-w-56 flex-1 border border-input bg-card px-4 py-3"
                />
                <datalist id="rfq-products">
                  {products.map((p) => (
                    <option key={p.sku} value={`${p.name} (${p.sku})`} />
                  ))}
                </datalist>
                <button type="button" onClick={addExtra} className={outlineButton}>
                  Add product
                </button>
              </div>
            </fieldset>

            <fieldset className="grid gap-6 md:grid-cols-2">
              <legend className="mb-4 font-display text-2xl text-primary">Your Company</legend>
              {(["company", "country", "email", "phone"] as const).map((key) =>
                fields[key].visible ? (
                  <Field
                    key={key}
                    label={fields[key].label}
                    name={key}
                    required={fields[key].required}
                    type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                  />
                ) : null,
              )}
            </fieldset>

            <fieldset className="grid gap-6 md:grid-cols-2">
              <legend className="mb-4 font-display text-2xl text-primary">Requirements</legend>
              {(
                ["material", "colourFinish", "customization", "packaging", "destination"] as const
              ).map((key) =>
                fields[key].visible ? (
                  <Field
                    key={key}
                    label={fields[key].label}
                    name={key}
                    required={fields[key].required}
                  />
                ) : null,
              )}
              {fields.incoterm.visible && (
                <label className="block text-sm">
                  {fields.incoterm.label}
                  {fields.incoterm.required && " *"}
                  <select
                    name="incoterm"
                    defaultValue=""
                    required={fields.incoterm.required}
                    className={field}
                  >
                    <option value="">Select</option>
                    {INCOTERMS.map((term) => (
                      <option key={term}>{term}</option>
                    ))}
                  </select>
                </label>
              )}
              {fields.message.visible && (
                <label className="block text-sm md:col-span-2">
                  {fields.message.label}
                  {fields.message.required && " *"}
                  <textarea
                    name="message"
                    rows={5}
                    maxLength={5000}
                    required={fields.message.required}
                    className={field}
                  />
                </label>
              )}
              {fields.attachment.visible &&
                (supabase ? (
                  <label className="block text-sm md:col-span-2">
                    {fields.attachment.label} (PDF, image, DWG or DXF, up to {maxUploadMb} MB)
                    {fields.attachment.required && " *"}
                    <input
                      name="attachment"
                      type="file"
                      accept={UPLOAD_TYPES}
                      required={fields.attachment.required}
                      className={field}
                    />
                  </label>
                ) : (
                  <p className="text-sm text-muted-foreground md:col-span-2">
                    Reference designs or drawings can be attached to the email that opens when you
                    send this form.
                  </p>
                ))}
            </fieldset>

            <div aria-hidden className="absolute -left-[9999px]">
              <label>
                Leave this empty
                <input name="mrd_check" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {error && (
              <p role="alert" className="border border-destructive p-4 text-sm text-destructive">
                {error}
              </p>
            )}
            {state === "mailto" && (
              <p role="status" className="border border-gold bg-accent p-4 text-sm">
                Your email app should now be open with this enquiry filled in. It is not sent until
                you press send there. If nothing opened, write to {settings.exportEmail}.
              </p>
            )}
            <button
              type="submit"
              disabled={state === "sending"}
              className={`${primaryButton} w-full disabled:opacity-60 sm:w-auto`}
            >
              {state === "sending" ? "Sending…" : "Send Enquiry"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
