import { Award, CheckCircle2, Factory, Handshake, Package, ShieldCheck } from "lucide-react";

const REASONS = [
  {
    icon: Award,
    title: "Authentic Khurja Ceramic Heritage",
    copy: "400 years of craft tradition in every piece",
  },
  {
    icon: Factory,
    title: "Reliable Manufacturing Network",
    copy: "Established factory partnerships across Khurja",
  },
  {
    icon: CheckCircle2,
    title: "Quality Focused Production",
    copy: "International testing standards on every batch",
  },
  {
    icon: ShieldCheck,
    title: "Export-Oriented Approach",
    copy: "End-to-end export documentation and logistics support",
  },
  {
    icon: Package,
    title: "Flexible Bulk Supply",
    copy: "Scalable orders for hotels, distributors, and importers",
  },
  {
    icon: Handshake,
    title: "Professional Buyer Support",
    copy: "Dedicated account management for global clients",
  },
];

export function WhyMridora() {
  return (
    <section id="why" className="py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <h2 className="text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.05]">
            Why
            <span className="mt-1 block italic text-primary">MRIDORA</span>
          </h2>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
            We bridge the gap between traditional Indian craftsmanship and the demanding standards
            of international procurement.
          </p>
          <span className="mt-10 block h-px w-28 bg-border" />
        </div>

        <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <article key={reason.title} className="flex gap-5">
              <reason.icon className="mt-1 h-6 w-6 shrink-0 text-primary" strokeWidth={1.4} />
              <div>
                <h3 className="text-xl">{reason.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{reason.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
