import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import image from "@/assets/col-artisan.jpg";

const title = "About MRIDORA — Ceramic Sourcing & Merchant Export";
const description =
  "MRIDORA is an India-based B2B ceramics sourcing and export company working with Indian ceramic manufacturing partners in the Khurja cluster, supplying tableware, hotelware, serveware and decorative ceramics to international buyers.";

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

const WHAT_WE_ARE = [
  {
    title: "A B2B ceramics sourcing company",
    body: "We work only with business buyers — no retail sales, no public price list. Every requirement is quoted per enquiry.",
  },
  {
    title: "An export partner",
    body: "Specification, sampling, production follow-up, inspection coordination, export packing and documentation run through a single export desk.",
  },
  {
    title: "Working with Indian manufacturing partners",
    body: "We source from established Indian ceramic manufacturers. We do not own a factory and do not present ourselves as the manufacturer.",
  },
  {
    title: "Sourcing from the Khurja ceramic cluster",
    body: "Khurja in Uttar Pradesh is a long-established Indian ceramic manufacturing cluster, and our primary sourcing base for tableware and decorative ceramics.",
  },
  {
    title: "Focused on four product groups",
    body: "Tableware, hotelware, serveware and decorative ceramics — kept within five defined design collections.",
  },
];

const BUYERS = [
  "Hotels",
  "Restaurants",
  "Hospitality Groups",
  "Importers",
  "Distributors",
  "Retailers",
  "Global Sourcing Companies",
];

const PRINCIPLES = [
  {
    title: "We are a merchant exporter",
    body: "We source from Indian ceramic manufacturing partners. We do not claim ownership of production facilities.",
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
            Connecting Indian Ceramic Manufacturing with Global B2B Demand
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            MRIDORA connects international buyers with Indian ceramic production. Our work sits
            between the buyer's specification and the factory floor: selection, development,
            follow-up and export execution.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">What MRIDORA is</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {WHAT_WE_ARE.map((item) => (
              <div key={item.title} className="bg-card p-7">
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-10">
          <div>
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">How we work</h2>
            <p className="mt-6 text-muted-foreground">
              Each enquiry is assessed against the capabilities of the manufacturing partners we
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
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {BUYERS.map((buyer) => (
                <li key={buyer} className="flex gap-3 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" />
                  {buyer}
                </li>
              ))}
            </ul>
          </div>
          <figure className="border border-border bg-card">
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

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Leadership</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-[minmax(0,20rem)_1fr]">
            <div className="flex flex-col justify-center bg-card p-8">
              <span className="font-display text-4xl text-primary">NY</span>
              <p className="mt-5 text-lg">Nishu Yadav</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Founder &amp; Managing Director
              </p>
            </div>
            <div className="bg-card p-8">
              <p className="text-muted-foreground">
                MRIDORA is led by its founder, who works directly with buyers on specification,
                sourcing decisions and export execution. Enquiries are handled by the founder-led
                export desk, so buyers deal with one accountable point of contact from first brief
                through to shipment.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Company registration details, banking references and partner information are
                available on request to serious buyers.
              </p>
              <a href="mailto:export@mridoraglobal.com" className="btn btn-outline mt-7">
                Contact the export desk
              </a>
            </div>
          </div>
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
