export function Quote() {
  return (
    <section className="bg-espresso py-20">
      <div className="mx-auto flex max-w-5xl items-start gap-6 px-6 lg:px-10">
        <span aria-hidden className="font-display text-5xl leading-none text-primary">&ldquo;</span>
        <div>
          <p className="font-display text-[clamp(1.35rem,2.6vw,2rem)] italic leading-snug text-espresso-foreground">
            Our mission is to carry Khurja&apos;s ceramic legacy to tables around the world.
          </p>
          <p className="mt-4 eyebrow text-espresso-foreground/60">
            — Nishu Yadav, Founder · MRIDORA
          </p>
        </div>
      </div>
    </section>
  );
}
