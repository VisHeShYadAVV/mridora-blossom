import { BadgeCheck, Droplet, Flame, Layers, PackageCheck, ShieldCheck } from "lucide-react";

const SPECS = [
  {
    icon: Flame,
    title: "1200°C+",
    sub: "Gas Tunnel Kiln Firing",
    copy: "All products are fired in modern gas tunnel kilns at temperatures exceeding 1200°C — achieving complete vitrification throughout the ceramic body.",
  },
  {
    icon: Droplet,
    title: "0% Porosity",
    sub: "Zero-Porosity Guarantee",
    copy: "Our unconditional zero-porosity finish ensures no liquid absorption, preventing bacterial growth and making every piece safe for commercial food service.",
  },
  {
    icon: ShieldCheck,
    title: "Impact Tested",
    sub: "Chip Resistance",
    copy: "Deep vitrification at extreme temperature produces a dense, homogeneous structure that delivers superior chip and crack resistance under daily hospitality use.",
  },
  {
    icon: BadgeCheck,
    title: "Internationally Certified",
    sub: "Export-Grade Standards",
    copy: "Every batch meets international quality benchmarks — tested for thermal shock, glaze adhesion, and mechanical strength before leaving our facility.",
  },
  {
    icon: Layers,
    title: "Full Body Fusion",
    sub: "Deep Vitrification",
    copy: "High-temperature firing fuses clay minerals into a glass-like matrix, eliminating internal micro-voids for a product that is harder, denser, and more durable.",
  },
  {
    icon: PackageCheck,
    title: "Global-Ready",
    sub: "Export Packaging",
    copy: "Purpose-built export packaging protects every piece across international shipping — from Khurja warehouses to hotel procurement centres worldwide.",
  },
];

export function Quality() {
  return (
    <section className="bg-espresso pb-28 text-espresso-foreground lg:pb-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-primary">Engineering</p>
          <h2 className="mt-5 text-[clamp(2.2rem,4.4vw,3.4rem)]">Uncompromising Quality</h2>
          <p className="mt-8 text-lg leading-relaxed text-espresso-foreground/70">
            Built on industrial precision and artisan heritage — every piece leaves Khurja having
            passed through fire above 1200°C and met an unconditional standard of finish.
          </p>
        </div>

        <div className="mt-20 grid border-t border-espresso-foreground/15 md:grid-cols-2 lg:grid-cols-3">
          {SPECS.map((spec) => (
            <article
              key={spec.title}
              className="border-b border-espresso-foreground/15 px-2 py-12 lg:border-r lg:px-10 lg:last:border-r-0"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center border border-primary/40 text-primary">
                <spec.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 text-2xl">{spec.title}</h3>
              <p className="mt-2 eyebrow text-primary">{spec.sub}</p>
              <p className="mt-5 leading-relaxed text-espresso-foreground/70">{spec.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
