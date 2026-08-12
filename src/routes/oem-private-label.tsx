import { createFileRoute, Link } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";
import image from "@/assets/col-white-minimal.jpg";

const title = "OEM & Private Label Ceramics — MRIDORA";
const description =
  "OEM and private-label ceramic development for importers, retailers and hospitality groups: buyer brief, technical development, prototyping, approval, production with Indian manufacturing partners and export.";

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
    title: "Buyer Brief",
    body: "Photo, CAD, drawing or reference sample — along with target quantity, destination market and price positioning.",
  },
  {
    step: "02",
    title: "Technical Development",
    body: "Shape, dimensions, ceramic body, glaze and decoration are defined with the selected Indian manufacturing partner.",
  },
  {
    step: "03",
    title: "Prototype",
    body: "Sample development against the approved technical sheet. Sampling charges and timelines are confirmed in writing first.",
  },
  {
    step: "04",
    title: "Approval",
    body: "Buyer approval of the physical sample, decoration, branding and packaging before any bulk commitment.",
  },
  {
    step: "05",
    title: "Production",
    body: "Manufacturing through selected Indian ceramic manufacturing partners, scheduled and followed up by our export desk.",
  },
  {
    step: "06",
    title: "Export",
    body: "Quality control, export packing, container loading and shipment against the agreed Incoterms.",
  },
];

const CAPABILITIES = [
  {
    title: "Custom Shapes",
    body: "New or modified forms, subject to mould feasibility at the partner unit.",
  },
  {
    title: "Custom Glazes",
    body: "Matte, gloss, reactive and textured glaze directions developed on sample.",
  },
  {
    title: "Custom Colours",
    body: "Colour matching against buyer references, confirmed on fired samples.",
  },
  {
    title: "Logo / Branding",
    body: "Backstamps, logos and brand marks applied to approved artwork.",
  },
  {
    title: "Custom Decoration",
    body: "Hand-painted, decal, embossed and banded decoration options.",
  },
  {
    title: "Custom Packaging",
    body: "Retail-ready boxes, inserts, labels, barcoding and master carton marking.",
  },
  {
    title: "CAD-Based Development",
    body: "Development from buyer CAD files or technical drawings.",
  },
  {
    title: "Prototype Development",
    body: "Pre-production samples for review, revision and final sign-off.",
  },
];

function OemPage() {
  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
            OEM &amp; Private Label
          </p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            From buyer concept to export-ready ceramic production.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            MRIDORA is a B2B sourcing and export partner. We do not own a manufacturing facility —
            we coordinate OEM and private-label development with established Indian ceramic
            manufacturing partners and manage the programme through to shipment.
          </p>
          <Link to="/request-quote" className="btn btn-on-navy mt-9">
            Start an OEM Enquiry
          </Link>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Development process</h2>
          <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
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

      <section className="bg-sand py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Customisation capabilities</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Every capability below is confirmed against the selected production partner before
            commitment. Minimum order quantities are Available on Request and vary by shape,
            decoration and packaging; lead times are confirmed per programme.
          </p>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <div key={item.title} className="bg-card p-6">
                <h3 className="text-base">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
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
            <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">What to send with your brief</h2>
            <ul className="mt-7 space-y-3 text-muted-foreground">
              {[
                "Reference photos, CAD files, drawings or a physical sample",
                "Shapes, sizes and capacities required",
                "Decoration, colour and branding direction",
                "Indicative quantity per SKU and annual requirement",
                "Destination market and packaging requirement",
                "Any testing or documentation your market requires",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-7 text-sm text-muted-foreground">
              Where information is not yet established for a programme, we state Available on
              Request rather than estimating.
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Start a Programme"
        title="Start an OEM enquiry."
        body="Share references, quantities and target market. We will confirm what is producible with our manufacturing partners and outline sampling steps."
      />
    </>
  );
}
