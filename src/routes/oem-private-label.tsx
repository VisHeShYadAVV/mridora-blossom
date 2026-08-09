import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import image from "@/assets/col-white-minimal.jpg";

const title = "OEM & Private Label Ceramics — MRIDORA GLOBAL";
const description =
  "OEM and private-label ceramic development for importers, retailers and hospitality groups: shape development, decoration, branding and packaging, sourced from Indian manufacturing partners.";

export const Route = createFileRoute("/oem-private-label")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: OemPage,
});

const STEPS = [
  {
    step: "01",
    title: "Requirement Brief",
    body: "You share product references, shapes, sizes, decoration direction, target quantity and destination market.",
  },
  {
    step: "02",
    title: "Feasibility Review",
    body: "We review the brief with suitable Indian manufacturing partners and confirm what can be produced, at what quantity band.",
  },
  {
    step: "03",
    title: "Sampling",
    body: "Samples are developed for approval. Sampling charges, timelines and revision rounds are confirmed in writing before work starts.",
  },
  {
    step: "04",
    title: "Branding & Packaging",
    body: "Backstamps, logos, labels, gift boxes and master carton artwork are applied to approved specifications, subject to production capability.",
  },
  {
    step: "05",
    title: "Production & Inspection",
    body: "Bulk production is scheduled with the partner unit. Pre-shipment checks are coordinated and third-party inspection can be arranged on request.",
  },
  {
    step: "06",
    title: "Export & Shipment",
    body: "Documentation, packing and freight coordination handled by our export desk against the agreed Incoterms.",
  },
];

const OPTIONS = [
  "Custom shapes and sizes (subject to mould feasibility)",
  "Decoration: hand-painted, decal, embossed and reactive glaze options",
  "Colour matching against buyer references",
  "Backstamp and logo application",
  "Retail-ready packaging and gift boxes",
  "Buyer-specific master carton marking and barcoding",
];

function OemPage() {
  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">OEM &amp; Private Label</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            Ceramic programmes developed under your own brand.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            As a merchant exporter we coordinate custom development with Indian ceramic
            manufacturers. Every capability below is confirmed against the selected production
            partner before commitment.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-10">
          <figure className="border border-border bg-sand">
            <img
              src={image}
              alt="Plain white ceramic plates and bowls suitable for private-label decoration"
              width={1200}
              height={900}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>
          <div>
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">What we can customise</h2>
            <ul className="mt-7 space-y-3">
              {OPTIONS.map((option) => (
                <li key={option} className="flex gap-3 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" />
                  {option}
                </li>
              ))}
            </ul>
            <p className="mt-7 text-sm text-muted-foreground">
              Minimum order quantities are Available on Request and vary by shape, decoration and
              packaging. Lead times are To Be Confirmed per programme.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Development process</h2>
          <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.step} className="bg-card p-7">
                <p className="text-sm tracking-[0.2em] text-gold">{item.step}</p>
                <h3 className="mt-3 text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Start a Programme"
        title="Send your private-label brief."
        body="Share references, quantities and target market. We will confirm what is producible with our partner units and outline sampling steps."
      />
    </>
  );
}
