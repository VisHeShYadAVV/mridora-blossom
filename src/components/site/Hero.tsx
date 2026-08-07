import heroImage from "@/assets/hero-table.jpg";

export function Hero() {
  return (
    <section id="top" className="relative min-h-screen">
      <img
        src={heroImage}
        alt="Cream speckled ceramic tableware set on a rustic dining table"
        width={1920}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/55 to-espresso/20" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-28 pb-20 lg:px-10">
        <h1 className="animate-rise max-w-3xl text-espresso-foreground text-[clamp(2.6rem,6.4vw,5.1rem)] leading-[1.04]">
          Crafted from the earth,
          <span className="block italic">Designed for the world.</span>
        </h1>

        <p
          className="animate-rise mt-8 max-w-xl text-lg leading-relaxed text-espresso-foreground/85"
          style={{ animationDelay: "140ms" }}
        >
          400 years of ceramic heritage combined with skilled craftsmanship and global quality
          standards. MRIDORA creates premium ceramic tableware solutions for international homes,
          hotels, restaurants, and hospitality businesses.
        </p>

        <div className="animate-rise mt-12" style={{ animationDelay: "260ms" }}>
          <a
            href="#enquiry"
            className="inline-flex items-center bg-primary px-10 py-5 eyebrow text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Request Business Enquiry
          </a>
        </div>
      </div>
    </section>
  );
}
