import potter from "@/assets/heritage-potter.jpg";

const FACTS = [
  { value: "400+ Years", label: "Heritage" },
  { value: "Global Export Ready", label: "Status" },
  { value: "Premium Quality", label: "Standards" },
];

export function Heritage() {
  return (
    <section id="heritage" className="py-28 lg:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <h2 className="text-[clamp(2.2rem,4.4vw,3.5rem)] leading-[1.1]">
            Born from Khurja&apos;s
            <span className="mt-1 block italic text-primary">Ceramic Heritage</span>
          </h2>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Khurja, India has been known for generations as a centre of ceramic craftsmanship.
            MRIDORA connects this heritage with international markets by delivering carefully
            crafted ceramic tableware for global buyers.
          </p>

          <dl className="mt-14">
            {FACTS.map((fact) => (
              <div key={fact.label} className="border-b border-border py-6">
                <dt className="text-xl">{fact.value}</dt>
                <dd className="mt-2 eyebrow text-muted-foreground">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -left-4 -top-4 h-full w-full border border-primary/30" />
          <img
            src={potter}
            alt="Craftsman shaping a clay bowl on a traditional potter's wheel in Khurja"
            width={1024}
            height={1280}
            loading="lazy"
            className="relative aspect-[4/5] w-full object-cover shadow-soft"
          />
        </div>
      </div>
    </section>
  );
}
