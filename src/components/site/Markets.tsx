import { Compass, Globe, Map, MapPin } from "lucide-react";

const MARKETS = [
  {
    icon: Compass,
    title: "Gulf Countries",
    copy: "UAE, Saudi Arabia, Qatar, Kuwait, Bahrain",
  },
  { icon: MapPin, title: "Europe", copy: "UK, Germany, France, Netherlands, Italy" },
  { icon: Map, title: "North America", copy: "USA, Canada, Mexico" },
  { icon: Globe, title: "Asia Pacific", copy: "Singapore, Malaysia, Australia, Japan" },
];

export function Markets() {
  return (
    <section id="markets" className="bg-sand py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2.4rem,5vw,4rem)]">Serving Global Markets</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            MRIDORA is a trusted sourcing partner for international buyers across four continents.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MARKETS.map((market) => (
            <article key={market.title} className="bg-card p-8 shadow-soft">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                <market.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-8 text-2xl">{market.title}</h3>
              <p className="mt-4 leading-relaxed text-muted-foreground">{market.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
