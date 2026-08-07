import design from "@/assets/process-design.jpg";
import production from "@/assets/process-production.jpg";
import quality from "@/assets/process-quality.jpg";
import shipping from "@/assets/process-shipping.jpg";

const STEPS = [
  {
    no: "01",
    title: "Design & Development",
    copy: "Concept creation, pattern development, custom design consultation",
    image: design,
    alt: "Ceramic designers reviewing sketches and prototypes",
  },
  {
    no: "02",
    title: "Ceramic Production",
    copy: "Traditional wheel throwing and slip casting using Khurja's finest clay",
    image: production,
    alt: "Artisan slip casting ceramics in a production workshop",
  },
  {
    no: "03",
    title: "Quality Inspection",
    copy: "Rigorous international standard testing before every export",
    image: quality,
    alt: "Inspector checking a finished ceramic plate under light",
  },
  {
    no: "04",
    title: "Global Shipping",
    copy: "Premium protective packaging, export documentation, worldwide delivery",
    image: shipping,
    alt: "Workers packing ceramic plates into wooden export crates",
  },
];

export function Manufacturing() {
  return (
    <section id="manufacturing" className="bg-espresso py-28 text-espresso-foreground lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <p className="eyebrow text-primary">The Process</p>
        <h2 className="mt-5 max-w-2xl text-[clamp(2.2rem,4.6vw,3.6rem)] leading-[1.1]">
          The Journey from
          <span className="mt-1 block italic text-primary">Clay to Client</span>
        </h2>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-espresso-foreground/70">
          Our manufacturing process combines four centuries of intuitive craftsmanship with modern,
          export-grade quality control systems.
        </p>

        <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.no}>
              <img
                src={step.image}
                alt={step.alt}
                width={1200}
                height={960}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-lg text-primary">{step.no}</span>
                <h3 className="text-2xl">{step.title}</h3>
              </div>
              <p className="mt-4 leading-relaxed text-espresso-foreground/70">{step.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
