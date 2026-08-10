import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import image from "@/assets/col-artisan.jpg";

const title = "About MRIDORA — Ceramic Sourcing & Merchant Export";
const description =
  "MRIDORA is an India-based ceramic sourcing and merchant export company serving importers, distributors, hospitality groups and retailers across the Gulf, Europe, North America and Asia Pacific.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AboutPage,
});

const BUYERS = [
  "Importers & Distributors",
  "Hotel & Restaurant Groups",
  "Retail Chains & Concept Stores",
  "Interior Designers & Project Buyers",
];

const PRINCIPLES = [
  {
    title: "We are a merchant exporter",
    body: "We source from Indian ceramic manufacturing partners. We do not present ourselves as the manufacturer and we do not claim ownership of production facilities.",
  },
  {
    title: "Only confirmed information",
    body: "Where minimum quantities, lead times, pricing or certifications are not yet established for an order, we state Available on Request or To Be Confirmed rather than estimating.",
  },
  {
    title: "One accountable point of contact",
    body: "Specification, sampling, production follow-up, inspection coordination and shipment run through a single export desk.",
  },
];

function AboutPage() {
  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">About</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            An India-based ceramic sourcing and export company.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            MRIDORA connects international buyers with Indian ceramic production. Our work
            sits between the buyer's specification and the factory floor: selection, development,
            follow-up and export execution.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-10">
          <div>
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">How we work</h2>
            <p className="mt-6 text-muted-foreground">
              Each enquiry is assessed against the capabilities of the manufacturing clusters we
              work with. We propose products that can actually be produced at the quantity, quality
              level and price positioning the buyer needs — and say so when a requirement is not
              feasible.
            </p>
            <p className="mt-4 text-muted-foreground">
              Orders are then managed end to end: sample approval, production scheduling with the
              partner unit, pre-shipment checks, export packing and documentation.
            </p>

            <h3 className="mt-10 text-xs uppercase tracking-[0.2em] text-primary">
              Who we work with
            </h3>
            <ul className="mt-5 space-y-3">
              {BUYERS.map((buyer) => (
                <li key={buyer} className="flex gap-3 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" />
                  {buyer}
                </li>
              ))}
            </ul>
          </div>
          <figure className="border border-border bg-sand">
            <img
              src={image}
              alt="Hand-finished artisanal ceramic vessels with reactive glaze finishes"
              width={1200}
              height={900}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>
        </div>
      </section>

      <section className="bg-sand py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">How we communicate</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="bg-card p-7">
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Contact"
        title="Start a conversation with our export desk."
        body="Send your requirement, target market and quantities. We reply with a clear view of what is feasible and the next step."
      />
    </>
  );
}
