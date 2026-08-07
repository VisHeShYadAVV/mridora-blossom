import custom from "@/assets/collection-custom.jpg";
import decorative from "@/assets/collection-decorative.jpg";
import dinnerware from "@/assets/collection-dinnerware.jpg";

const COLLECTIONS = [
  {
    title: "Ceramic Dinnerware",
    tagline: "Classic forms for everyday excellence",
    count: "8 Products",
    image: dinnerware,
    alt: "Cream ceramic dinnerware laid on an evening dining table",
  },
  {
    title: "Decorative Ceramics",
    tagline: "Sculptural pieces for interiors",
    count: "6 Products",
    image: decorative,
    alt: "Large terracotta ceramic vase in a warm minimal interior",
  },
  {
    title: "Custom Ceramic Solutions",
    tagline: "Bespoke production for your brand",
    count: "8 Products",
    image: custom,
    alt: "Bespoke glazed ceramic tableware on a long hotel banquet table",
  },
];

export function Collections() {
  return (
    <section id="products" className="py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="eyebrow text-primary">Our Range</p>
          <h2 className="mt-5 text-[clamp(2.4rem,5vw,4rem)]">Our Collections</h2>
          <span className="mx-auto mt-6 block h-px w-24 bg-primary/50" />
        </div>

        <div className="mt-16 space-y-6">
          {COLLECTIONS.map((item) => (
            <a
              key={item.title}
              href="#enquiry"
              className="group relative block overflow-hidden"
            >
              <img
                src={item.image}
                alt={item.alt}
                width={1600}
                height={912}
                loading="lazy"
                className="h-[280px] w-full object-cover transition-transform duration-[900ms] group-hover:scale-105 md:h-[380px]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/45 to-espresso/10" />

              <div className="absolute inset-0 flex items-center justify-between gap-6 px-8 md:px-14">
                <div>
                  <p className="eyebrow text-espresso-foreground/70">{item.count}</p>
                  <h3 className="mt-3 text-espresso-foreground text-[clamp(1.6rem,3.2vw,2.6rem)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-espresso-foreground/80">{item.tagline}</p>
                </div>
                <span className="hidden h-14 w-14 shrink-0 items-center justify-center border border-espresso-foreground/50 text-2xl text-espresso-foreground transition-colors group-hover:bg-primary group-hover:border-primary md:flex">
                  +
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
