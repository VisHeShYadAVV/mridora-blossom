import { createFileRoute } from "@tanstack/react-router";

import { CtaBand } from "@/components/site/CtaBand";

const title = "Quality Control & Export Process — MRIDORA";
const description =
  "How MRIDORA handles ceramic quality checks, packaging, documentation and shipment coordination for international buyers. Certifications available on request.";

export const Route = createFileRoute("/quality-export")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: QualityExportPage,
});

const CHECKS = [
  {
    title: "Specification Sign-off",
    body: "Approved samples and written specifications form the reference for bulk production. Tolerances are agreed before the order is placed.",
  },
  {
    title: "In-Production Review",
    body: "Progress is reviewed with the partner unit during production. Findings are shared with the buyer where they affect specification or timeline.",
  },
  {
    title: "Pre-Shipment Checks",
    body: "Visual, dimensional and packing checks are coordinated before dispatch. Third-party inspection can be arranged at buyer cost on request.",
  },
  {
    title: "Testing & Certification",
    body: "Test reports and certifications relevant to your market can be arranged on request through accredited laboratories, subject to product and cost confirmation.",
  },
];

const COMPLIANCE = [
  {
    title: "Food-Contact Testing",
    body: "For tableware, hotelware and serveware intended for food contact, testing can be arranged through accredited laboratories against the standard applicable to your destination market.",
  },
  {
    title: "Lead & Cadmium Testing",
    body: "Lead and cadmium release testing on glazed and decorated surfaces can be arranged per production lot, at buyer cost, with reports issued by the testing laboratory.",
  },
  {
    title: "Third-Party Inspection",
    body: "Inspection by an agency of the buyer's choice can be coordinated at the partner unit before dispatch, including AQL sampling on request.",
  },
  {
    title: "Destination-Market Requirements",
    body: "Share the regulations, marking and documentation your market requires and we will confirm with the production partner what can be met for that order.",
  },
];

const EXPORT_STEPS = [
  {
    title: "Packing",
    body: "Inner protection, master cartons and palletisation planned per product fragility and destination handling. Buyer carton marking supported.",
  },
  {
    title: "Documentation",
    body: "Commercial invoice, packing list and standard export paperwork prepared by our export desk. Additional market-specific documents arranged on request.",
  },
  {
    title: "Freight Coordination",
    body: "Sea and air freight coordinated with forwarders against agreed Incoterms. FCL and consolidated LCL options reviewed per order size.",
  },
  {
    title: "Dispatch Updates",
    body: "Booking, container stuffing and dispatch milestones reported to the buyer through to shipment.",
  },
];

function QualityExportPage() {
  return (
    <>
      <section className="bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Quality &amp; Export</p>
          <h1 className="mt-5 max-w-3xl text-navy-foreground text-[clamp(2.1rem,5vw,3.4rem)] leading-tight">
            Controlled specification, documented shipment.
          </h1>
          <p className="mt-6 max-w-2xl text-navy-foreground/75">
            We do not operate our own factory, so our quality role is coordination: agreeing the
            specification, checking output against it, and managing export execution.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Quality control approach</h2>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2">
            {CHECKS.map((item) => (
              <div key={item.title} className="bg-card p-7">
                <h3 className="text-lg">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          <h2 className="text-[clamp(1.6rem,3.2vw,2.4rem)]">Export process</h2>
          <ol className="mt-10 space-y-px border border-border bg-border">
            {EXPORT_STEPS.map((item, index) => (
              <li key={item.title} className="grid gap-3 bg-card p-7 sm:grid-cols-[4rem_1fr]">
                <span className="text-sm tracking-[0.2em] text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-10 max-w-3xl text-sm text-muted-foreground">
            Certifications, test reports and compliance documentation are Available on Request and
            confirmed per product and destination market. We do not claim certifications that have
            not been issued for a specific order.
          </p>
        </div>
      </section>

      <CtaBand
        eyebrow="Compliance"
        title="Tell us the standards your market requires."
        body="Share the certifications, test reports and packaging requirements applicable to your market, and we will confirm what can be arranged for your order."
      />
    </>
  );
}
